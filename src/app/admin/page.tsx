"use client";

import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";

type Summary = {
  submissionCount: number;
  taskAnswerCount: number;
  averageFinancialLiteracyScore: number;
  averageTaskScore: number;
  averageTaskTimeSeconds: number;
  byStudyGroup: Record<string, { count: number; averageFinancialLiteracy: number; averageTaskScore: number; averageTaskTimeSeconds: number }>;
  byTask: Array<{
    taskId: string;
    count: number;
    averageTimeSeconds: number;
    medianTimeSeconds: number;
    minTimeSeconds: number;
    maxTimeSeconds: number;
    averageScore: number;
    distribution: Record<string, number>;
    phases: Array<{
      phase: string;
      count: number;
      averageTimeSeconds: number;
      medianTimeSeconds: number;
      averageScore: number;
      distribution: Record<string, number>;
    }>;
  }>;
  scaleAverages: Record<string, { count: number; average: number }>;
  recentSubmissions: Array<{
    id: string;
    created_at: string;
    study_group: string;
    age_group: string;
    gender: string;
    financial_literacy_score: number;
  }>;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSummary() {
    setLoading(true);
    setError("");

    try {
      if (!authenticated) {
        const loginResponse = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password })
        });
        const loginData = await loginResponse.json().catch(() => ({}));
        if (!loginResponse.ok) throw new Error(loginData.error ?? "Neispravna admin lozinka.");
        setAuthenticated(true);
      }

      const response = await fetch("/api/admin/summary");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Admin statistika nije dostupna.");
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin statistika nije dostupna.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setSummary(null);
    setPassword("");
  }

  return (
    <main className="shell">
      <div className="container">
        <div className="topbar">
          <div className="brand">
            <span className="eyebrow">Admin</span>
            <h1>Statistika ankete</h1>
          </div>
          <a className="button secondary" href="/">Anketa</a>
        </div>

        <div className="panel section">
          <div className="grid two">
            <label className="field">
              <span className="label">Admin lozinka</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") loadSummary();
                }}
              />
            </label>
            <div className="actions">
              <button className="button" onClick={loadSummary} disabled={!password || loading}>
                <RefreshCw size={18} /> Učitaj statistiku
              </button>
              <a className="button secondary" href={authenticated ? "/api/admin/export" : "#"} aria-disabled={!authenticated}>
                <Download size={18} /> CSV izvoz
              </a>
              {authenticated && (
                <button className="button secondary" onClick={logout}>
                  Odjava
                </button>
              )}
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          {summary && (
            <section className="section">
              <div className="grid two">
                <div className="callout">
                  <strong>Broj predanih anketa</strong>
                  <p>{summary.submissionCount}</p>
                </div>
                <div className="callout">
                  <strong>Prosjek financijske pismenosti</strong>
                  <p>{summary.averageFinancialLiteracyScore} / 21</p>
                </div>
                <div className="callout">
                  <strong>Broj odgovora na zadatke</strong>
                  <p>{summary.taskAnswerCount}</p>
                </div>
                <div className="callout">
                  <strong>Prosjek vremena zadatka</strong>
                  <p>{formatSeconds(summary.averageTaskTimeSeconds)}</p>
                </div>
                <div className="callout">
                  <strong>Prosjek bodova zadataka</strong>
                  <p>{summary.averageTaskScore} / 5</p>
                </div>
              </div>

              <div>
                <h2>Po zadacima</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Zadatak</th>
                        <th>Broj odgovora</th>
                        <th>Prosječno vrijeme</th>
                        <th>Medijan</th>
                        <th>Min / max</th>
                        <th>Prosječni bodovi</th>
                        <th>Distribucija opcija</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.byTask.map((task) => (
                        <tr key={task.taskId}>
                          <td>{task.taskId}</td>
                          <td>{task.count}</td>
                          <td>{formatSeconds(task.averageTimeSeconds)}</td>
                          <td>{formatSeconds(task.medianTimeSeconds)}</td>
                          <td>{formatSeconds(task.minTimeSeconds)} / {formatSeconds(task.maxTimeSeconds)}</td>
                          <td>{task.averageScore} / 5</td>
                          <td>{formatDistribution(task.distribution)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2>Po fazama zadataka</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Zadatak</th>
                        <th>Faza</th>
                        <th>Broj</th>
                        <th>Prosječno vrijeme</th>
                        <th>Medijan vremena</th>
                        <th>Prosječni bodovi</th>
                        <th>Opcije</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.byTask.flatMap((task) =>
                        task.phases.map((phase) => (
                          <tr key={`${task.taskId}-${phase.phase}`}>
                            <td>{task.taskId}</td>
                            <td>{formatPhase(phase.phase)}</td>
                            <td>{phase.count}</td>
                            <td>{formatSeconds(phase.averageTimeSeconds)}</td>
                            <td>{formatSeconds(phase.medianTimeSeconds)}</td>
                            <td>{phase.averageScore} / 5</td>
                            <td>{formatDistribution(phase.distribution)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2>Usporedba po studiju/skupini</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Skupina</th>
                        <th>Broj sudionika</th>
                        <th>Prosjek financijske pismenosti</th>
                        <th>Prosjek bodova zadataka</th>
                        <th>Prosjek vremena zadataka</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.byStudyGroup).map(([group, value]) => (
                        <tr key={group}>
                          <td>{group}</td>
                          <td>{value.count}</td>
                          <td>{value.averageFinancialLiteracy} / 21</td>
                          <td>{value.averageTaskScore} / 5</td>
                          <td>{formatSeconds(value.averageTaskTimeSeconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2>Prosjeci skala dodatnih pitanja</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Pitanje</th>
                        <th>Broj odgovora</th>
                        <th>Prosjek</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.scaleAverages).map(([key, value]) => (
                        <tr key={key}>
                          <td>{key}</td>
                          <td>{value.count}</td>
                          <td>{value.average} / 5</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2>Zadnje predaje</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Vrijeme</th>
                        <th>Studij</th>
                        <th>Dob</th>
                        <th>Spol</th>
                        <th>Fin. pismenost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentSubmissions.map((submission) => (
                        <tr key={submission.id}>
                          <td>{new Date(submission.created_at).toLocaleString("hr-HR")}</td>
                          <td>{submission.study_group}</td>
                          <td>{submission.age_group}</td>
                          <td>{submission.gender}</td>
                          <td>{submission.financial_literacy_score} / 21</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function formatDistribution(distribution: Record<string, number>) {
  const entries = Object.entries(distribution);
  if (entries.length === 0) return "-";
  return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
}

function formatSeconds(value: number) {
  if (!value) return "0s";
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function formatPhase(phase: string) {
  if (phase === "before_ai") return "Bez AI-a";
  if (phase === "after_ai") return "S AI-em";
  return "Jedan odgovor";
}
