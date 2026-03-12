# Budget vs actual cost and backend requirements

## Does writing costs determine if the project is losing money?

**Yes.** Recording expenses is recording **actual cost**. For each project:

- **Budget** = planned amount (stored on the project or budget records).
- **Actual cost** = sum of all logged expenses (and any other cost entries) for that project.

**Budget vs actual:**

- If **actual > budget** → project is over budget (losing money vs plan).
- If **actual ≤ budget** → project is on or under budget.

The app already supports this: project detail has a **Budget Overview** and a **Variance** tab that compare budget to actual (e.g. Materials/Labor/Equipment and a Budget vs Actual chart). The Cost Management page shows expenses per project and uses the same data for variance.

## Backend requirements (if not already in place)

To support “budget vs actual” and “is this project losing money?” the backend should:

1. **Project budget**
   - Each project has a **budget** (total or per phase/category), e.g. a `budget` field on the project or a dedicated budget entity linked to the project.

2. **Expenses linked to projects**
   - Every expense has a **projectId** (or equivalent) so costs can be summed per project.

3. **Aggregation and comparison**
   - Either:
     - **Option A:** Existing endpoints already return project budget and total actual cost (e.g. cost overview, expense summary, or dashboard APIs). The frontend uses these for the Variance tab and Budget Overview.
     - **Option B:** Add or extend an endpoint that returns, per project:
       - Budget (total or by category)
       - Total actual cost (sum of expenses and any other cost types)
       - Optional: variance (e.g. `budget - actual`)

If the backend already exposes project budget and expense totals (or a cost summary) that the frontend uses today, **no backend change is required**. If budget or per-project actual totals are missing, add a `budget` (or equivalent) and ensure expenses are summed by `projectId`; optionally expose a small summary endpoint (budget + actual + variance) for each project.
