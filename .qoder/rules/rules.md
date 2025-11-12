---
trigger: always_on
alwaysApply: true
---

# 📐 AI Code Writing Rules

## 0. Start
- My system is MacOS.
- Always chat in Indonesiam.

## 1. General Structure
- Always use Markdown with proper code blocks (```language ... ```).
- Provide **complete, runnable code**, not pseudocode.
- Include all required imports or dependencies.

## 2. Naming Conventions
- Use **clear and descriptive names**.
  - `camelCase` for variables & functions (JavaScript/TypeScript).
  - `PascalCase` for components & classes.
  - `snake_case` for Python variables & functions.
- Avoid generic names like `temp`, `data1`.

## 3. Code Style & Formatting
- Indentation: **2 spaces** for JS/TS/React, **4 spaces** for Python.
- Always close statements with semicolons in JS/TS.
- Keep lines under ~80–100 characters when possible.
- Use consistent quotation marks (`'single'` or `"double"`), do not mix.

## 4. Comments & Documentation
- Add **short, useful comments** above non-trivial logic.
- For functions: include a brief docstring/JSDoc with parameters and return type.
- Avoid excessive or obvious comments.

## 5. Modularity & Reusability
- Keep functions small with **one responsibility**.
- Extract repeated logic into helper functions.
- Use constants/config objects for values instead of hardcoding.

## 6. Error Handling
- Always add **basic error handling**:
  - `try/catch` in JS/TS.
  - `try/except` in Python.
- Log meaningful error messages.
- Never silently fail unless intentional.

## 7. Input & Output
- Validate input arguments when needed.
- Ensure output is predictable and consistent.
- If applicable, provide an **example usage/demo**.

## 8. Code Consistency
- Stick to a single style per project.
- Prefer ES modules (`import/export`) over CommonJS (`require`).
- Prefer `async/await` over callbacks or `.then()` chaining.

## 9. Framework/Stack Best Practices
- **React/React Native**: use function components + hooks (`useState`, `useEffect`).
- **Node.js**: use `async/await`, avoid blocking calls.
- **Python**: use `f-strings` for string formatting.

## 10. Readability & Clean Code
- Use meaningful spacing and blank lines to group logic.
- Avoid deep nesting (prefer early return).
- Keep function length reasonable (≤ 50 lines ideally).

## 11. Testing & Examples
- Provide **dummy data** or mock examples when useful.
- Show sample input/output for clarity.
- Include unit-test-like snippets if requested.

## 12. Security & Safety
- Sanitize inputs where relevant.
- Avoid exposing secrets, tokens, or credentials in examples.
- Prefer environment variables for sensitive configs.

## 13. Performance & Scalability
- Optimize only when necessary (clarity > premature optimization).
- Use efficient data structures (e.g., `Set` for uniqueness checks).
- Avoid unnecessary computations inside loops.

## 14. Answer Format
Every answer should follow this order:
1. 📌 **Title** (short and descriptive)  
2. ✨ **Brief explanation** (what the code does)  
3. 💻 **Full runnable code**  
4. 🔍 **Example usage** (optional but recommended)  

## 15. Final Check
- Ensure code runs without syntax errors.
- Ensure imports are correct and consistent.
- Ensure answer matches exactly what the user asked for.
