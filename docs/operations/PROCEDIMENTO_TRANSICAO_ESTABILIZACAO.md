# Procedimento de transição — estabilização de autenticação e recuperação

Este procedimento descreve impactos potenciais em instalações existentes. Não autoriza implantação, alteração de contas ou restauração; cada ação requer aprovação operacional própria. Esta alteração não foi executada contra bancos, contas ou instalações de produção.

## Segredos e sessões

1. Antes de qualquer atualização, o responsável pela instalação deve inventariar a configuração atual em canal seguro, sem registrar valores de segredo em logs, tickets ou evidências.
2. Configure `AQUILA_AUTH_SECRET` com pelo menos 32 bytes aleatórios, distribuído pelo mecanismo secreto aprovado da instalação. Não reutilize o segredo de backup nem um valor de exemplo.
3. Atualize os serviços web e Electron que emitem/verificam as respectivas sessões de forma coordenada e reinicie-os em janela aprovada. Tokens assinados com o fallback anterior ou com uma chave antiga deixam de validar; usuários precisarão autenticar novamente. Não existe conversão segura de cookies antigos.
4. Verifique o login e o encerramento de sessão com contas de teste autorizadas. Não compartilhe o segredo nem o inclua em evidência.
5. Se o endpoint de evidências de auditoria estiver habilitado, configure também `AQUILA_AUDIT_HMAC_SECRET` como um segredo independente de pelo menos 32 bytes; ele não substitui nem reutiliza a chave de sessão.

## Administradores e usuários

1. Faça inventário somente de leitura dos administradores autorizados e do estado de suas contas. Preserve contas ativas legítimas; não execute reset, exclusão ou seed para “corrigir” o inventário.
2. A inicialização Electron não recria nem substitui um administrador existente. Se não existir administrador, a criação inicial requer aprovação e credencial individual temporária por `AQUILA_INITIAL_ADMIN_USERNAME` e `AQUILA_INITIAL_ADMIN_PASSWORD` (mínimo de 16 bytes). Configure-a por canal secreto e remova-a do ambiente depois da inicialização confirmada; a marca `auth_provisioning` impede a repetição automática.
3. Configure credenciais independentes para cada aplicação: Electron usa `AQUILA_INITIAL_ADMIN_USERNAME` e `AQUILA_INITIAL_ADMIN_PASSWORD`; web usa `AQUILA_WEB_ADMIN_USERNAME` e `AQUILA_WEB_ADMIN_PASSWORD`, além das variáveis por papel (`AQUILA_COORD_*`, `AQUILA_TEACHER_*`, `AQUILA_PARENT_*` e `AQUILA_STUDENT_*`). Valores incompletos ou senhas curtas são recusados. Não reutilize credenciais de demonstração ou a senha de outro serviço.
4. Seeds sintéticos são opt-in apenas em `NODE_ENV=development`, com a flag correspondente e `AQUILA_DEMO_SEED_DB_PATH` absoluto apontando para um banco dedicado diferente do banco da instalação. Os seeds não são um mecanismo de recuperação de contas excluídas.
5. O cadastro de aluno cria apenas o registro escolar; não cria login nem senha. O cadastro de professor exige uma senha individual explicitamente fornecida com pelo menos 16 bytes e não retorna a senha em resposta. Contas já existentes não são alteradas. Para instalações que tenham usado senha previsível derivada de CPF ou usuário, faça inventário somente de leitura e conduza eventual revogação/reativação individual em procedimento separado, aprovado e com preservação das contas legítimas; esta alteração não detecta nem corrige automaticamente essas contas.

## Restauração SQLite

A restauração automatizada e o restore drill permanecem desabilitados porque a segurança de promoção atômica com WAL, bloqueios, interrupções e rollback ainda não foi demonstrada. Preserve os backups existentes sem tentar restaurá-los por essa rota. Não remova manualmente o banco atual, `-wal` ou `-shm`; solicite um procedimento de recuperação aprovado e validado em ambiente isolado antes de qualquer operação sobre dados.

## Portal de estudantes e liberação

O caminho suportado é `/portal/aluno` (singular). Sessões de estudante são redirecionadas para esse caminho e não autorizam outros portais.

Testes unitários e de middleware demonstram os contratos locais, mas não comprovam uma jornada Electron escolar completa, recuperação de banco sob interrupção, identidade de versão/build instalado ou aprovação operacional de uma escola. Esses gates devem ser verificados no processo de release/piloto, sem inferir exposição real de instalações a partir dos achados de código.
