import { ProgramList } from "@/components/sections/program-list";
import { COPY } from "@/content/copy";

export function Program() {
  const { program } = COPY;
  return (
    <section className="section" aria-labelledby="program-title">
      <div className="shell">
        <ProgramList
          items={program.items}
          intro={
            <div className="max-w-[38rem]">
              <h2 id="program-title" className="t-h2">
                {program.title}
              </h2>
              <p className="t-lead measure mt-5">{program.lead}</p>
            </div>
          }
        />
      </div>
    </section>
  );
}
