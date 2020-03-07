import { matchInterpolatedShellCommand } from ".";

describe("dotenv-command", () => {
  describe("matchInterpolatedShellCommand", () => {
    it("matches a basic interpolated shell command", () => {
      let match = matchInterpolatedShellCommand("SHA=$(git rev-parse HEAD)");
      let expected = ["$(git rev-parse HEAD)", , "$", "(git rev-parse HEAD)"];

      expect([...match!]).toEqual(expected);
      expect(match!.groups).toEqual({ cmd: "(git rev-parse HEAD)" });
    });

    it("matches nested interpolated shell commands", () => {
      let match = matchInterpolatedShellCommand(
        "SHA=$(echo $(git rev-parse HEAD))"
      );
      let expected = [
        "$(echo $(git rev-parse HEAD))",
        ,
        "$",
        "(echo $(git rev-parse HEAD))"
      ];

      expect([...match!]).toEqual(expected);
      expect(match!.groups).toEqual({ cmd: "(echo $(git rev-parse HEAD))" });
    });

    it("matches escaped dollar signs", () => {
      let match = matchInterpolatedShellCommand("SHA=\\$(git rev-parse HEAD)");
      let expected = [
        "\\$(git rev-parse HEAD)",
        "\\",
        "$",
        "(git rev-parse HEAD)"
      ];

      expect([...match!]).toEqual(expected);
      expect(match!.groups).toEqual({
        backslash: "\\",
        cmd: "(git rev-parse HEAD)"
      });
    });

    it("handles unbalanced parentheses", () => {
      let matches = [
        "SHA=$(git rev-parse HEAD",
        "SHA=$git rev-parse HEAD)"
      ].map(string => matchInterpolatedShellCommand(string));

      matches.forEach(match => {
        expect(match).toBeNull();
      });
    });
  });
});
