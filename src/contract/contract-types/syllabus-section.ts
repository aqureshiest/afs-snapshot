import ContractExecutable from "../contract-executable.js";

class Section extends ContractExecutable<Definition, Transformation> {
  get executionName(): string {
    return "Section";
  }
  transform(_, __, definition: Definition): Transformation {
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
    definition.progress = {
      totalQuestions: stats.total,
      completedQuestions: stats.completed,
    };
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const { statuses, ...result } = definition;
    if (definition.mode === "section") {
      return result as unknown as Transformation;
    } else {
      return { progress: result.progress };
    }
  }
}
export default Section;
