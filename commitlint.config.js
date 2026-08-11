const fs = require("fs");
const path = require("path");

function listApps() {
  const appsDir = path.join(__dirname, "apps");
  if (!fs.existsSync(appsDir)) return [];
  return fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

const TYPES_REQUIRING_BODY = ["feat", "fix", "security"];

module.exports = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "body-required-for-type": (parsed) => {
          const { type, body } = parsed;
          if (!TYPES_REQUIRING_BODY.includes(type)) return [true];
          const hasBody = typeof body === "string" && body.trim().length > 0;
          return [
            hasBody,
            `body is required for type "${type}" — explain why, not what`,
          ];
        },
      },
    },
  ],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "chore", "refactor", "test", "perf", "security"],
    ],
    "scope-enum": [2, "always", listApps()],
    "scope-empty": [2, "never"],
    "body-required-for-type": [2, "always"],
  },
};
