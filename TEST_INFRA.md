# E2E Test Infra: sumstar-os (Direct Chat Feature)

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Chat History Storage | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 2 | Agent Persona & Context | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 3 | Chat UI with Cards | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| 4 | Simulated Chat E2E | ORIGINAL_REQUEST R4 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: `npx tsx scripts/test_chat.ts` (or similar TS executor)
- Test case format: Automated simulation using API or backend services
- Directory layout: tests inside `scripts/`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full conversation simulation | F1, F2, F4 | High |

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 per feature
- Tier 3: pairwise coverage of major feature interactions
- Tier 4: ≥5 realistic application scenarios
