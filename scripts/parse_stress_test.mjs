import { parseRecruiterCommandMock } from "../services/geminiMock.js";

(async () => {
  const total = 2000;
  const concurrency = 100;
  const samples = [
    "Shortlist top 3",
    "Filter for React skills with min_experience 3",
    "Summarize candidate Emily Johnson",
    "Generate questions for John Doe",
    "Draft email for Jane Smith",
    "Analytics summary",
    "Some random unsupported command",
  ];

  let completed = 0;
  let errors = 0;
  const latencies = [];

  const runOne = async (i) => {
    const input = samples[i % samples.length] + ` #${i}`;
    const start = Date.now();
    try {
      const res = await parseRecruiterCommandMock(input);
      const dur = Date.now() - start;
      latencies.push(dur);
      completed++;
      if (i % 500 === 0) process.stdout.write(`.${i}`);
      return res;
    } catch (e) {
      errors++;
      return null;
    }
  };

  const tasks = [];
  for (let i = 0; i < total; i++) tasks.push(i);

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency).map((idx) => runOne(idx));
    await Promise.all(batch);
  }

  const sum = latencies.reduce((a, b) => a + b, 0);
  const avg = latencies.length ? (sum / latencies.length).toFixed(2) : 0;
  latencies.sort((a, b) => a - b);
  const p95 = latencies.length
    ? latencies[Math.floor(latencies.length * 0.95)]
    : 0;
  console.log(
    `\nStress test complete: total=${total}, completed=${completed}, errors=${errors}`,
  );
  console.log(`Avg latency: ${avg}ms, p95: ${p95}ms`);
})();
