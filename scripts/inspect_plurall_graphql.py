import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'authorization': 'Bearer f4a7a3900f79f51dbf13a82898fc9068',
    'content-type': 'application/json',
    'referer': 'https://bibliotecadeconteudos.plurall.net/'
}

q_args = """
query QueryArgs {
  __schema {
    queryType {
      fields {
        name
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
        args {
          name
        }
      }
    }
  }
}
"""
resp2 = requests.post('https://aps-tmp.plurall.net/tmp/graphql', headers=headers, json={'query': q_args})
if resp2.status_code == 200:
    data2 = resp2.json()
    all_fields = data2.get('data', {}).get('__schema', {}).get('queryType', {}).get('fields', [])
q_contents_test = """
query GetContentsTest($first: Int, $searchText: String, $supertypes: [String]) {
  Contents(first: $first, searchText: $searchText, supertypes: $supertypes) {
    pageInfo {
      totalRecords
      hasNextPage
    }
    edges {
      node {
        id
        title
        description
        type
        tags {
          edges {
            node {
              text
            }
          }
        }
      }
    }
  }
}
"""

q_filter_test = """
query GetFilteredQuestions($query: String, $first: Int) {
  Questions(query: $query, first: $first) {
    pageInfo {
      totalRecords
      hasNextPage
    }
    edges {
      node {
        id
        title
        number
        text
        officialAnswer {
          text
        }
        solution {
          text
        }
        exams {
          id
          title
        }
        disciplines {
          name
        }
        matrixCodes
      }
    }
  }
}
"""

q_single_content = """
query GetSingleContent {
  Contents(first: 1, searchText: "FUVEST", supertypes: ["activity"]) {
    edges {
      node {
        id
        title
        description
        authorHint
        type
        difficulty
        tags {
          edges {
            node {
              text
            }
          }
        }
      }
    }
  }
}
"""

resp_sc = requests.post('https://aps-tmp.plurall.net/tmp/graphql', headers=headers, json={'query': q_single_content})
if resp_sc.status_code == 200:
    node = resp_sc.json()['data']['Contents']['edges'][0]['node']
    print(json.dumps(node, indent=2, ensure_ascii=False))
else:
    print("Error:", resp_sc.text[:300])






























