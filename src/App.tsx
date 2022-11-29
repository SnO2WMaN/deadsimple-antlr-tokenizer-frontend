import clsx from "clsx";
import ky from "ky";
import React, { useCallback, useMemo, useState } from "react";

export const Char: React.FC<{
  c: string;
  handle(): void;
  clear(): void;
  vari: boolean;
  func: boolean;
  appl: boolean;
}> = ({ c, handle, clear, vari, func, appl }) => {
  return (
    <span
      onMouseEnter={() => {
        handle();
      }}
      onMouseLeave={() => {
        clear();
      }}
      className={clsx(
        ["relative", {
          "bg-yellow-400": ((!vari && !func) && appl),
          "bg-teal-400": (!vari && func),
          "bg-purple-400": vari,
        }],
      )}
    >
      {c}
    </span>
  );
};

export const App: React.FC = () => {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<null | string>(null);
  const [result, setResult] = useState<
    null | {
      type: string;
      start: { line: number; column: number };
      stop: { line: number; column: number };
    }[]
  >(null);

  const handle = useCallback(async () => {
    const res = await ky.post("https://deadsimple-antlr-tokenizer.deno.dev/lambda", { body: input })
      .json<
        {
          type: string;
          start: { line: number; column: number };
          stop: { line: number; column: number };
        }[]
      >();
    setParsed(input);
    setResult(res);
  }, [input]);
  const [cursor, setCursor] = useState<null | { line: number; column: number }>(null);

  const vari = useMemo<[[number, number], [number, number]] | null>(() => {
    if (!cursor || !result) return null;
    const mostmatch = result
      .filter(({ type }) => type === "vari")
      .filter(({ start, stop }) =>
        start.line === cursor.line
        && stop.line === cursor.line
        && start.column <= cursor.column
        && cursor.column <= stop.column
      )
      .at(-1);
    if (!mostmatch) return null;
    return [
      [mostmatch.start.line, mostmatch.start.column],
      [mostmatch.stop.line, mostmatch.stop.column],
    ];
  }, [cursor, result]);
  const func = useMemo<[[number, number], [number, number]] | null>(() => {
    if (!cursor || !result) return null;
    const mostmatch = result
      .filter(({ type }) => type === "func")
      .filter(({ start, stop }) =>
        start.line === cursor.line
        && stop.line === cursor.line
        && start.column <= cursor.column
        && cursor.column <= stop.column
      )
      .at(-1);
    if (!mostmatch) return null;
    return [
      [mostmatch.start.line, mostmatch.start.column],
      [mostmatch.stop.line, mostmatch.stop.column],
    ];
  }, [cursor, result]);
  const appl = useMemo<[[number, number], [number, number]] | null>(() => {
    if (!cursor || !result) return null;
    const mostmatch = result
      .filter(({ type }) => type === "appl")
      .filter(({ start, stop }) =>
        start.line === cursor.line
        && stop.line === cursor.line
        && start.column <= cursor.column
        && cursor.column <= stop.column
      )
      .at(-1);
    if (!mostmatch) return null;
    return [
      [mostmatch.start.line, mostmatch.start.column],
      [mostmatch.stop.line, mostmatch.stop.column],
    ];
  }, [cursor, result]);

  return (
    <div
      className={clsx(
        ["w-full"],
        ["min-h-screen"],
        ["py-4"],
      )}
    >
      <main
        className={clsx(["container"], ["mx-auto"], ["flex", ["flex-col", "lg:flex-row"]], ["gap-x-4"], ["gap-y-4"])}
      >
        <div className={clsx(["flex"], ["flex-col"], ["items-start"])}>
          <textarea
            value={input}
            className={clsx(
              ["w-[512px]"],
              ["h-[256px]"],
              ["p-2"],
              ["font-mono"],
              ["resize-none"],
              ["border"],
              ["text-sm"],
            )}
            onChange={(e) => {
              setResult(null);
              setInput(e.target.value);
            }}
          >
          </textarea>
          <button
            className={clsx(
              ["mt-2"],
              ["bg-blue-400", "hover:bg-blue-500"],
              ["text-blue-50", "hover:text-blue-100"],
              ["px-2"],
              ["py-1"],
              ["rounded"],
            )}
            onClick={() => {
              handle();
            }}
          >
            parse
          </button>
        </div>
        <div className={clsx(["flex-grow"], ["flex-shrink-0"])}>
          <div className={clsx(["text-sm"], ["font-mono"])}>
            {!cursor && <span>pick!</span>}
            {cursor && <span>{cursor.line},{cursor.column}</span>}
          </div>
          <div
            className={clsx(
              ["mt-2"],
              ["p-2"],
              ["select-none"],
              ["border"],
            )}
          >
            {parsed?.split("\n").map((line, l) => (
              <div key={l} className={clsx(["font-mono"], ["text-lg"])}>
                {line.split("").map((char, c) => (
                  <Char
                    key={`${l}-${c}`}
                    c={char}
                    handle={() => setCursor({ line: l + 1, column: c })}
                    clear={() => setCursor(null)}
                    vari={vari
                      ? ((vari[0][0] <= l + 1 && l + 1 <= vari[1][0]) && (vari[0][1] <= c && c <= vari[1][1]))
                      : false}
                    func={func
                      ? ((func[0][0] <= l + 1 && l + 1 <= func[1][0]) && (func[0][1] <= c && c <= func[1][1]))
                      : false}
                    appl={appl
                      ? ((appl[0][0] <= l + 1 && l + 1 <= appl[1][0]) && (appl[0][1] <= c && c <= appl[1][1]))
                      : false}
                  />
                ))}
              </div>
            ))}
          </div>
          <div
            className={clsx(
              ["mt-2"],
              ["p-2"],
              ["select-none"],
              ["border"],
            )}
          >
            {result?.map((txt, i) => (
              <div key={i} className={clsx(["font-mono"], ["text-xs"])}>{JSON.stringify(txt)}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
