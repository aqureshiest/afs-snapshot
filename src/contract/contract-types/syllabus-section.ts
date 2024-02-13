import ContractType from "./base-contract.js";

class Section extends ContractType<Definition, Transformation> {
  get contractName(): string {
    return "Section";
  }
  transform(context: Injections, definition: Definition): Transformation {
    const stats = {
      total: 0,
      completed: 0,
      incompleted: 0,
    };
    definition.statuses.forEach((status) => {
      stats.total++;
      stats[status]++;
    });
    definition.status =
      stats.completed === stats.total ? "completed" : "incomplete";
    definition.progress = Math.round((stats.completed / stats.total) * 100);
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const { statuses, ...result } = definition;
    return result as unknown as Transformation;
  }
}
export default Section;
