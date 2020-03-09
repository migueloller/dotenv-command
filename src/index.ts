import { execSync } from "child_process";

function escapeRegExp(string: string): string {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}

/**
 * We want to use this Ruby regular expression:
 *
 * ```
 * /
 *   (?<backslash>\\)?   # is it escaped with a backslash?
 *   \$                  # literal $
 *   (?<cmd>             # collect command content for eval
 *     \(                # require opening paren
 *     ([^()]|\g<cmd>)+  # allow any number of non-parens, or balanced
 *                       # parens (by nesting the <cmd> expression
 *                       # recursively)
 *     \)                # require closing paren
 *   )
 * /x
 * ```
 *
 * Unfortunately, JavaScript regular expressions don't support recurson so we have to implement it
 * manually instead.
 *
 * @see {@link https://github.com/bkeepers/dotenv/blob/9e16a424083055139e62d60a55bd0fec53003cee/lib/dotenv/substitutions/command.rb}
 */
export function matchInterpolatedShellCommand(
  string: string,
  innerRegExpString = "[^()]"
): RegExpMatchArray | null {
  let regExp = new RegExp(
    `(?<backslash>\\\\)?(?<dollar>\\$)?(?<cmd>\\([^()]*${innerRegExpString}[^()]*\\))`
  );

  let match = string.match(regExp);

  if (!match) return null;

  let outerMatch = matchInterpolatedShellCommand(
    string,
    escapeRegExp(match.groups!.cmd)
  );

  if (outerMatch) return outerMatch;

  if (match.groups!.dollar) {
    delete match.groups!.dollar;

    return match;
  }

  return null;
}

export function interpolateShellCommands(string: string): string {
  let match = matchInterpolatedShellCommand(string);

  if (!match) return string;

  let matches = [match];

  while (
    (match = matchInterpolatedShellCommand(
      match.input!.slice(match.index! + match[0].length)
    ))
  ) {
    matches.push(match);
  }

  return matches
    .map(
      match =>
        match.input!.slice(0, match.index!) +
        (match.groups!.backslash
          ? match[0]
          : execSync(match.groups!.cmd.replace(/^\(/, "").replace(/\)$/, ""), {
              encoding: "utf8"
            }).replace(/[\r\n]+$/, ""))
    )
    .join("");
}
