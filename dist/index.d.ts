import { AggregatedResult, Test } from '@jest/reporters';
declare class GitHubReporter {
    onRunComplete(contexts: Set<Test['context']>, testResult: AggregatedResult): Promise<void>;
}
export = GitHubReporter;
//# sourceMappingURL=index.d.ts.map