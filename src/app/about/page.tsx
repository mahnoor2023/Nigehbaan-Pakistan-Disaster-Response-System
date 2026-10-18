import PageShell from "@/components/PageShell";

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-2 font-semibold text-slate-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <PageShell title="About and trade-offs" subtitle="Problem 01 (Disaster Response): who needs help most, and who gets the scarce boats first.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Box title="How a household is scored (explainable, no black box)">
          <p><b>Priority = 100 × hazard × (0.3 + 0.7 × vulnerability).</b> Every number on screen comes with its top reasons.</p>
          <ul className="list-disc pl-5">
            <li><b>Hazard:</b> distance to nearest nala/river, low ground, ground floor, pushed through the flood-severity slider. If a volunteer reports water, the report overrides the model.</li>
            <li><b>Vulnerability:</b> 50% cannot self-evacuate (age, disability, illness, living alone), 20% cannot be warned (no smartphone/signal, simulated as absent from the demo list), 30% poverty.</li>
            <li><b>Dispatch:</b> households in priority order receive recommended seats at a site with remaining estimated capacity and a suitable simulated vehicle. Partial allocations leave explicit unmet demand; these are not recorded missions or arrivals.</li>
          </ul>
        </Box>

        <Box title="When data is missing or wrong">
          <ul className="list-disc pl-5">
            <li>An empty field never crashes anything. It gets a neutral guess, is listed as &quot;guessed&quot;, and lowers the household&apos;s <b>confidence</b> bar.</li>
            <li>Records simulated as absent from the demo list are flagged <b>unverified</b> and their confidence is cut; this is a scenario assumption, not evidence from a satellite or official register.</li>
            <li>A volunteer&apos;s check replaces the model: &quot;nobody found&quot; drops priority; a water report raises it. Duplicate reports (30 m, 10 min) are merged, not double counted.</li>
            <li>Network down: the Field App queues reports on the phone and sends them when the network returns (try &quot;Simulate outage&quot;).</li>
            <li>No terrain data for a household: hazard falls back to a mid value, never zero, so it is not silently ignored.</li>
          </ul>
        </Box>

        <Box title="What is real and what is simulated">
          <ul className="list-disc pl-5">
            <li><b>External geospatial inputs:</b> Malir building points and candidate facility locations are OSM-derived, not field-verified. Existing elevation metadata conflicts: the Malir area record says SRTM while the acquisition script says Copernicus DEM via Open-Meteo. Treat the elevation provider as unverified until the original import is traced.</li>
            <li><b>Synthetic scenario data:</b> who lives in each building (age, illness, income band, phone), demo-list membership, shelter capacities, and the rescue fleet. These are not survey results, satellite detections, official warning-list records, or live availability.</li>
          </ul>
        </Box>

        <Box title="Trade-offs we chose">
          <ul className="list-disc pl-5">
            <li><b>Explainable rules over machine learning:</b> responders must trust a priority order; there is no real flood outcome data to train on.</li>
            <li><b>Greedy dispatch over an optimal solver:</b> instant, easy to explain, good enough for a first wave. It is not guaranteed optimal.</li>
            <li><b>Straight-line distance</b> (with a detour factor) instead of road routing: works offline; real ETAs will differ.</li>
            <li><b>No backend:</b> data is static JSON and the shared state lives in the browser, so the demo works without internet services.</li>
            <li><b>Fairness:</b> vehicles go to the highest priority first, but poor and hidden households are scored up, not down, for being hard to reach or warn.</li>
          </ul>
        </Box>

        <Box title="Left out (and why)">
          <ul className="list-disc pl-5">
            <li>No verified rainfall or river-gauge observations feed. The separate intelligence page shows Open-Meteo model values and forecasts; the severity slider remains an independent simulated flood scenario.</li>
            <li>Road blockages and multi-trip rescue scheduling: would need road graph and time simulation.</li>
            <li>Real accounts and privacy controls: a real system must protect people&apos;s location and health data.</li>
          </ul>
        </Box>
      </div>
    </PageShell>
  );
}
