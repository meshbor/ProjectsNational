import { GLOSSARY } from "@/lib/projects/glossary";

export function GlossaryHint() {
  return (
    <div className="glossary">
      <button
        type="button"
        className="glossary-btn"
        aria-describedby="glossary-tip"
        aria-label="Глоссарий сокращений"
        title="Глоссарий"
      >
        ?
      </button>
      <div id="glossary-tip" role="tooltip" className="glossary-panel">
        <p className="glossary-title">Сокращения</p>
        <dl>
          {GLOSSARY.map((item) => (
            <div key={item.abbr}>
              <dt>{item.abbr}</dt>
              <dd>{item.meaning}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
