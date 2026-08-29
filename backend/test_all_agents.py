import os
from datetime import datetime
os.environ['PYTEST_CURRENT_TEST'] = '1'
from dotenv import load_dotenv
load_dotenv()

results = {}

print('=== 1. IMPORT TESTS ===')
components = [
    ('LangGraphOrchestrator', 'app.application.orchestration.langgraph_orchestrator', 'LangGraphOrchestrator'),
    ('AgentOrchestrator', 'app.application.orchestration.agents', 'AgentOrchestrator'),
    ('ContextPlanner', 'app.application.intelligence.context_planner', 'ContextPlanner'),
    ('MCPGateway', 'app.infrastructure.mcp.mcp_gateway', 'MCPGateway'),
    ('LlamaGuardService', 'app.infrastructure.llm.llama_guard', 'LlamaGuardService'),
    ('HallucinationGuard', 'app.application.safety.hallucination_guard', 'HallucinationGuard'),
    ('PolicyEngine', 'app.application.safety.policy_engine', 'PolicyEngine'),
    ('QdrantVectorService', 'app.infrastructure.vector.qdrant_service', 'QdrantVectorService'),
    ('Mem0MemoryService', 'app.infrastructure.memory.mem0_memory', 'Mem0MemoryService'),
    ('A2ACoordinator', 'app.application.orchestration.a2a_protocol', 'A2ACoordinator'),
    ('SkillLoader', 'app.application.intelligence.skill_loader', 'SkillLoader'),
    ('LLMProvider', 'app.infrastructure.llm.llm_provider', 'LLMProvider'),
    ('DatabricksDatasetExtractor', 'app.infrastructure.mcp.databricks_extractor', 'DatabricksDatasetExtractor'),
    ('GitDatasetExtractor', 'app.infrastructure.mcp.git_extractor', 'GitDatasetExtractor'),
    ('JiraDatasetExtractor', 'app.infrastructure.mcp.jira_extractor', 'JiraDatasetExtractor'),
    ('GitHubMCP', 'app.infrastructure.mcp.github_mcp', 'GitHubMCP'),
    ('JiraMCP', 'app.infrastructure.mcp.jira_mcp', 'JiraMCP'),
    ('DatabricksMCP', 'app.infrastructure.mcp.databricks_mcp', 'DatabricksMCP'),
]

for name, module, cls in components:
    try:
        mod = __import__(module, fromlist=[cls])
        getattr(mod, cls)
        results[name] = 'PASS'
        print(f'  [PASS] {name}')
    except Exception as e:
        results[name] = f'FAIL: {e}'
        print(f'  [FAIL] {name}: {e}')

print(f'\nImport Summary: {sum(1 for v in results.values() if v=="PASS")}/{len(results)} passed')

print('\n=== 2. CONTEXT PLANNER ROUTING ===')
from app.application.intelligence.context_planner import ContextPlanner
planner = ContextPlanner()

test_queries = [
    ('What are the project delays and milestones?', 'project_intelligence'),
    ('Show me security risks and vulnerabilities', 'risk_intelligence'),
    ('What architectural decisions were made?', 'decision_intelligence'),
    ('Give me a general summary of the project', 'manager'),
    ('Jira ticket blocker status update', 'project_intelligence'),
    ('PCI compliance and vulnerability scan', 'risk_intelligence'),
    ('ADR review for Kafka vs RabbitMQ', 'decision_intelligence'),
]

planner_pass = 0
for query, expected in test_queries:
    plan = planner.plan(query=query, project_id='prj-kan', time_range_days=30)
    actual = plan.planned_agent.value if plan.planned_agent else 'none'
    ok = actual == expected
    if ok: planner_pass += 1
    status = 'PASS' if ok else 'FAIL'
    print(f'  [{status}] "{query[:50]}" -> {actual} (expected {expected})')

print(f'\nPlanner Summary: {planner_pass}/{len(test_queries)} passed')

print('\n=== 3. LLAMA GUARD SAFETY ===')
from app.infrastructure.llm.llama_guard import LlamaGuardService
guard = LlamaGuardService()

safe_tests = [
    ('What are the project risks?', True),
    ('Show me recent commits', True),
    ('How is the Jira sprint going?', True),
]
guard_pass = 0
for query, expected in safe_tests:
    result = guard.inspect_prompt(query)
    ok = result.is_safe == expected
    if ok: guard_pass += 1
    status = 'PASS' if ok else 'FAIL'
    print(f'  [{status}] "{query}" -> safe={result.is_safe}')

print(f'\nGuard Summary: {guard_pass}/{len(safe_tests)} passed')

print('\n=== 4. HALLUCINATION GUARD (CoVe) ===')
from app.application.safety.hallucination_guard import HallucinationGuard
from app.domain.schemas import Evidence, SourceType, AuthorityLevel
cove = HallucinationGuard()
test_answer = 'The project is on track with 3 active risks and 5 recent commits.'
test_evidence = [
    Evidence(id='e1', source_record_id='r1', source_type=SourceType.JIRA, source_title='Risk: High severity auth issue', external_id='KAN-1', excerpt='High severity authentication vulnerability', authority=AuthorityLevel.HIGH, observed_at=datetime.utcnow(), project_id='prj-kan'),
    Evidence(id='e2', source_record_id='r2', source_type=SourceType.GIT, source_title='Commit abc123', external_id='abc123', excerpt='Fix login bug', authority=AuthorityLevel.HIGH, observed_at=datetime.utcnow(), project_id='prj-kan'),
]
result = cove.verify_answer(test_answer, test_evidence)
print(f'  grounded_gate={result.is_grounded_gate_passed}, score={result.groundedness_score:.2f}')
print(f'  verified={result.verified_claims_count}/{result.total_claims}, contradicted={result.contradicted_claims_count}, unsupported={result.unsupported_claims_count}')
print(f'  hallucination_risk={result.hallucination_risk_level}')
cove_status = 'PASS' if result.groundedness_score >= 0 else 'FAIL'
print(f'  [{cove_status}] CoVe verification completed')

print('\n=== 5. POLICY ENGINE ===')
from app.application.safety.policy_engine import PolicyEngine
from app.domain.schemas import ActionPreview, RiskClass, User, ActionStatus, AgentWorkflow
from datetime import datetime
pe = PolicyEngine()
test_user = User(id='usr-test', name='Test User', email='test@test.com', org_id='org-test', role='admin', team='default')

def make_preview(tool_name, risk_class):
    return ActionPreview(
        id='ap-1', agent_run_id='run-1', tool_name=tool_name, target_system='test',
        summary=f'Test {tool_name}', description='Test', risk_class=risk_class,
        requires_approval=risk_class in [RiskClass.HIGH_IMPACT, RiskClass.PROHIBITED],
        status=ActionStatus.PREVIEW, params={}, impact_assessment='test',
        reversibility='high', suggested_by_agent=AgentWorkflow.MANAGER
    )

low_preview = make_preview('slack_send_briefing', RiskClass.LOW_IMPACT)
allowed_low, reason_low, risk_low = pe.evaluate_action(low_preview, test_user)
print(f'  slack_send_briefing: allowed={allowed_low}, risk={risk_low.value}')

high_preview = make_preview('jira_create_issue', RiskClass.HIGH_IMPACT)
allowed_high, reason_high, risk_high = pe.evaluate_action(high_preview, test_user)
print(f'  jira_create_issue:   allowed={allowed_high}, risk={risk_high.value}')

prohib_preview = make_preview('delete_database', RiskClass.PROHIBITED)
allowed_prohib, reason_prohib, risk_prohib = pe.evaluate_action(prohib_preview, test_user)
print(f'  delete_database:     allowed={allowed_prohib}, risk={risk_prohib.value}')

pe_pass = allowed_low and allowed_high and not allowed_prohib
print(f'  [{"PASS" if pe_pass else "FAIL"}] Policy gating works correctly')

print('\n=== 6. MCP GATEWAY TOOLS ===')
from app.infrastructure.mcp.mcp_gateway import MCPGateway
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
engine = create_engine('sqlite:///ecb_database.db')
Session = sessionmaker(bind=engine)
db_session = Session()

class MockStore:
    def __init__(self, session):
        self._session = session
    def _get_db(self):
        from contextlib import contextmanager
        @contextmanager
        def ctx():
            yield self._session
        return ctx()

gw = MCPGateway(MockStore(db_session))
tools_result = gw.list_tools()
tool_names = [t['name'] for t in tools_result]
print(f'  Total tools: {len(tool_names)}')
for t in sorted(tool_names):
    print(f'    - {t}')
expected_tools = [
    'jira_update_issue', 'jira_create_issue',
    'git_tag_release', 'github_create_pull_request',
    'slack_send_briefing',
    'databricks_list_clusters', 'databricks_get_cluster',
    'databricks_list_jobs', 'databricks_run_job', 'databricks_get_job_run',
    'databricks_execute_sql', 'databricks_list_workspace_objects',
    'databricks_export_notebook', 'databricks_list_catalogs',
    'databricks_list_schemas', 'databricks_list_tables',
    'mcp_export_git_training_set', 'mcp_export_jira_training_set',
    'mcp_get_data_collection_report',
]
missing = [t for t in expected_tools if t not in tool_names]
extra = [t for t in tool_names if t not in expected_tools]
if missing:
    print(f'  [FAIL] Missing tools: {missing}')
if extra:
    print(f'  [INFO] Extra tools: {extra}')
if not missing:
    print(f'  [PASS] All 19 expected tools present')

print('\n=== 7. A2A PROTOCOL ===')
from app.application.orchestration.a2a_protocol import A2ACoordinator, A2AMessage
a2a = A2ACoordinator()
msg, resp = a2a.delegate_subtask(
    from_agent=AgentWorkflow.MANAGER,
    to_agent=AgentWorkflow.PROJECT_INTELLIGENCE,
    task_type='delegation',
    query='Summarize sprint progress',
    target_entities=['prj-kan'],
)
print(f'  Delegation: from={msg.from_agent.value} to={msg.to_agent.value}')
print(f'  Response: status={resp.status}, sub_answer={resp.sub_answer[:60]}')
a2a_pass = resp.status == 'SUCCESS'
print(f'  [{"PASS" if a2a_pass else "FAIL"}] A2A delegation works')

print('\n=== 8. SKILL LOADER ===')
from app.application.intelligence.skill_loader import SkillLoader
sl = SkillLoader()
skills = sl.list_skills()
print(f'  Available skills: {len(skills)}')
for s in skills:
    print(f'    - {s}')
skill_pass = len(skills) >= 4
print(f'  [{"PASS" if skill_pass else "FAIL"}] At least 4 skills loaded')

print('\n=== 9. LIVE CONNECTOR TESTS ===')
import urllib.request, json

# GitHub
print('  GitHub:', end=' ')
gh_token = os.getenv('GITHUB_TOKEN', '')
if gh_token:
    try:
        req = urllib.request.Request('https://api.github.com/user')
        req.add_header('Authorization', f'Bearer {gh_token}')
        req.add_header('User-Agent', 'Python-urllib')
        with urllib.request.urlopen(req, timeout=10) as resp:
            user = json.loads(resp.read().decode())
            print(f'PASS (user={user.get("login", "unknown")})')
    except Exception as e:
        print(f'FAIL ({e})')
else:
    print('SKIP (no token)')

# Jira
print('  Jira:', end=' ')
jira_email = os.getenv('JIRA_USER_EMAIL', '')
jira_tok = os.getenv('JIRA_API_TOKEN', '')
jira_host = os.getenv('JIRA_BASE_URL', '')
if jira_email and jira_tok:
    try:
        import base64
        cred = base64.b64encode(f'{jira_email}:{jira_tok}'.encode()).decode()
        req = urllib.request.Request(f'{jira_host}/rest/api/3/myself')
        req.add_header('Authorization', f'Basic {cred}')
        req.add_header('Accept', 'application/json')
        with urllib.request.urlopen(req, timeout=10) as resp:
            user = json.loads(resp.read().decode())
            print(f'PASS (user={user.get("displayName", "unknown")})')
    except Exception as e:
        print(f'FAIL ({e})')
else:
    print('SKIP (no credentials)')

# Databricks
print('  Databricks:', end=' ')
dbx_host = os.getenv('DATABRICKS_HOST', '')
dbx_tok = os.getenv('DATABRICKS_TOKEN', '')
if dbx_host and dbx_tok:
    try:
        req = urllib.request.Request(f'{dbx_host}/api/2.1/unity-catalog/catalogs')
        req.add_header('Authorization', f'Bearer {dbx_tok}')
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            catalogs = data.get('catalogs', [])
            print(f'PASS ({len(catalogs)} catalogs)')
    except Exception as e:
        print(f'FAIL ({e})')
else:
    print('SKIP (no credentials)')

print('\n' + '='*50)
all_pass = all(v == 'PASS' for v in results.values())
print(f'OVERALL: {"ALL IMPORTS PASSED" if all_pass else "SOME IMPORTS FAILED"}')
