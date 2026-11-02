import json
import subprocess
import sys
import unittest


class OmrExplicitDenominatorsBenchmarkTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cmd = ["npx.cmd", "tsx", "scripts/benchmark_omr_controlled_dataset.ts"]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True, shell=True)
        # Extract the json object from output (filtering npm warnings if any)
        raw_output = res.stdout
        json_start = raw_output.find("{")
        cls.data = json.loads(raw_output[json_start:])

    def test_total_counts(self):
        self.assertEqual(self.data["totalCards"], 200)
        self.assertEqual(self.data["totalQuestions"], 4000)
        self.assertEqual(self.data["totalBubbles"], 20000)

    def test_all_five_denominators_present(self):
        metrics = self.data["explicitDenominatorMetrics"]
        required_keys = [
            "bubble_error_rate",
            "question_error_rate",
            "card_with_any_error_rate",
            "human_review_routing_rate",
            "student_id_mismatch_rate",
        ]
        for key in required_keys:
            self.assertIn(key, metrics)

    def test_bubble_error_rate_contract(self):
        m = self.data["explicitDenominatorMetrics"]["bubble_error_rate"]
        self.assertEqual(m["denominator_total_bubbles"], 20000)
        self.assertGreaterEqual(m["numerator_incorrect_bubbles"], 0)
        self.assertLessEqual(m["rate_pct"], 1.0)  # low error rate

    def test_question_error_rate_contract(self):
        m = self.data["explicitDenominatorMetrics"]["question_error_rate"]
        self.assertEqual(m["denominator_total_questions"], 4000)
        self.assertGreaterEqual(m["numerator_divergent_questions"], 0)
        self.assertLessEqual(m["rate_pct"], 2.0)

    def test_card_with_any_error_rate_contract(self):
        m = self.data["explicitDenominatorMetrics"]["card_with_any_error_rate"]
        self.assertEqual(m["denominator_total_cards"], 200)
        self.assertGreaterEqual(m["numerator_cards_with_any_error"], 0)

    def test_human_review_routing_rate_contract(self):
        m = self.data["explicitDenominatorMetrics"]["human_review_routing_rate"]
        self.assertEqual(m["denominator_total_cards"], 200)
        # Erasures and low confidence trigger human review
        self.assertGreater(m["numerator_cards_routed_to_review"], 0)
        self.assertEqual(self.data["humanReviewRoutingCount"], m["numerator_cards_routed_to_review"])

    def test_student_id_mismatch_rate_is_strictly_zero(self):
        m = self.data["explicitDenominatorMetrics"]["student_id_mismatch_rate"]
        self.assertEqual(m["denominator_total_cards"], 200)
        self.assertEqual(m["numerator_mismatched_student_ids"], 0)
        self.assertEqual(m["rate_pct"], 0.0)


if __name__ == "__main__":
    unittest.main()
