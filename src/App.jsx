import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Activity, BarChart3, BrainCircuit, CheckCircle2, ChevronRight, CircleHelp,
  ClipboardCheck, FileText, Gauge, HeartPulse, History as HistoryIcon, Home, Menu, Moon,
  Network, ScanEye, Settings, ShieldCheck, Sparkles, Sun, Upload, Users,
  X, Zap, AlertTriangle, Download, Send, RefreshCw, Radio, ArrowUpRight, ArrowLeft
} from "lucide-react";
import { analyzeImage, getAnalytics, getHistory, getSimulation, getSystemStatus, getReview, postReview, getReport, getScreening, getResultImageUrl } from "./services/screeningService";

const severity = ["No DR", "Mild DR", "Moderate DR", "Severe DR", "Proliferative DR"];
const screeningStorageKey = "eyraksha:last-screening";

function getStoredScreening() {
  try {
    return JSON.parse(sessionStorage.getItem(screeningStorageKey) || "null");
  } catch {
    return null;
  }
}

function Layout({ children, dark, setDark }) {
  const [open, setOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  useEffect(() => { getSystemStatus().then(setSystemStatus).catch(() => setSystemStatus({ status: "offline" })); }, []);
  const status = systemStatus?.status === "adapter_configured"
    ? { label: "AI READY", className: "good" }
    : systemStatus?.status === "offline"
      ? { label: "API OFFLINE", className: "bad" }
      : { label: "MODEL UNAVAILABLE", className: "warn" };
  const nav = [
    ["/", "Dashboard", Home],
    ["/screening", "Screening", ScanEye],
    ["/history", "Patient History", HistoryIcon],
    ["/analytics", "Analytics", BarChart3],
    ["/rural", "Rural Screening", Network],
    ["/simulation", "Simulation", Gauge],
    ["/about", "Technology", BrainCircuit]
  ];
  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark"><ScanEye size={22}/></div>
          <div><b>EyeRaksha</b><span>Explainable DR screening</span></div>
          <button className="icon-btn mobile-only" onClick={() => setOpen(false)}><X/></button>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({isActive}) => isActive ? "nav active" : "nav"}>
              <Icon size={18}/><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/review" className="nav"><ClipboardCheck size={18}/><span>Human Review</span></NavLink>
          <NavLink to="/settings" className="nav"><Settings size={18}/><span>Settings</span></NavLink>
        </div>
        <div className="privacy-card"><ShieldCheck size={18}/><div><b>Privacy first</b><span>Use patient IDs and follow your institution's data rules.</span></div></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setOpen(true)}><Menu/></button>
          <div className="breadcrumb">Explainable DR Screening</div>
          <div className="top-actions">
            <span className="api-badge"><span className="dot"/> REAL API</span>
            <span className={`system-chip ${status.className}`}><Radio size={12}/> {status.label}</span>
            <button className="icon-btn" onClick={() => setDark(!dark)}>{dark ? <Sun/> : <Moon/>}</button>
          </div>
        </header>
        <div className="content">{children}</div>
        <footer>AI-assisted screening prototype · Not a substitute for professional medical diagnosis.</footer>
      </main>
    </div>
  );
}

function PageTitle({eyebrow, title, text, action}) {
  return <div className="page-title">
    <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div>
    {action}
  </div>
}

function Metric({icon: Icon, label, value, hint}) {
  return <div className="metric card"><div className="metric-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></div>
}

function AnimatedECG() {
  return <div className="ecg" aria-label="Animated system heartbeat" role="img"><svg viewBox="0 0 480 72" preserveAspectRatio="none"><path d="M0 38 H72 L88 38 100 18 112 56 124 30 137 38 H208 L224 38 236 25 246 48 258 38 H330 L346 38 360 12 373 61 386 38 H480"/></svg><span><i/> Live signal</span></div>;
}

function RetinaScanner() {
  return <div className="retina-scanner" aria-label="Animated retinal scanning visualization" role="img">
    <div className="scanner-orbit orbit-one"/><div className="scanner-orbit orbit-two"/>
    <svg viewBox="0 0 360 360" className="retina-art">
      <defs><radialGradient id="retinaCore"><stop offset="0" stopColor="#efb16e"/><stop offset=".42" stopColor="#bd4d4c"/><stop offset="1" stopColor="#351d3d"/></radialGradient></defs>
      <circle cx="180" cy="180" r="132" fill="url(#retinaCore)"/>
      <circle cx="245" cy="142" r="24" fill="#ffdca2" opacity=".82"/>
      <g className="vessels" fill="none" stroke="#f7a48e" strokeWidth="3" opacity=".68">
        <path d="M242 143 C206 157 181 177 153 218 C134 246 111 265 69 278"/><path d="M238 147 C198 139 162 126 123 93 C101 75 77 68 55 64"/><path d="M236 150 C207 190 197 232 202 286"/><path d="M232 145 C195 111 174 77 169 42"/><path d="M225 151 C178 165 133 167 82 151"/>
      </g>
      <circle cx="180" cy="180" r="132" fill="none" stroke="#f8d3b0" strokeWidth="2" opacity=".34"/>
      <line className="scan-beam" x1="48" y1="78" x2="312" y2="78"/>
      <g className="detection-points"><circle cx="151" cy="218" r="5"/><circle cx="123" cy="93" r="4"/><circle cx="202" cy="286" r="4"/></g>
    </svg>
    <div className="scanner-caption"><span><i className="pulse"/> Scanning field</span><b>RETINAL AI</b></div>
  </div>;
}

function NeuralNetworkAmbient() {
  const links = [[24,28,116,76],[116,76,210,38],[116,76,214,132],[214,132,314,82],[210,38,314,82],[214,132,320,164],[314,82,402,42],[314,82,410,128]];
  const nodes = [[24,28],[116,76],[210,38],[214,132],[314,82],[320,164],[402,42],[410,128]];
  return <svg className="neural-network" viewBox="0 0 440 190" aria-hidden="true">{links.map(([x1,y1,x2,y2], index) => <line key={`link-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} style={{animationDelay:`${index * 180}ms`}}/>)}{nodes.map(([cx,cy], index) => <circle key={`node-${index}`} cx={cx} cy={cy} r={index % 3 === 0 ? 4 : 3} style={{animationDelay:`${index * 240}ms`}}/>)}</svg>;
}

function Hero({onStart}) {
  return <section className="hero-panel">
    <NeuralNetworkAmbient/>
    <div className="hero-copy"><span className="hero-kicker"><Sparkles size={14}/> AI-POWERED RETINAL SCREENING</span><h1>Protect vision.<br/><em>Detect earlier.</em><br/>Explain every decision.</h1><p>EyeRaksha is an AI-assisted retinal screening platform designed to support timely referral in rural and underserved communities.</p><div className="hero-actions"><button className="primary" onClick={onStart}><ScanEye size={17}/> Start new screening <ArrowUpRight size={15}/></button><button className="secondary" onClick={() => document.getElementById("platform-signal")?.scrollIntoView({behavior:"smooth"})}>Explore technology</button></div><div className="hero-disclaimer"><ShieldCheck size={15}/> AI-assisted screening, not a replacement for professional diagnosis.</div></div>
    <div className="hero-visual"><div className="data-orbit orbit-card quality"><span>Image quality</span><b><i/> Awaiting image</b></div><div className="data-orbit orbit-card explain"><span>Explainable AI</span><b><i/> Ready</b></div><RetinaScanner/><AnimatedECG/></div>
  </section>;
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const nav = useNavigate();
  useEffect(() => { getAnalytics().then(setData).catch(e => setError(e.message)); }, []);
  return <>
    <Hero onStart={() => nav("/screening", { state: { newScreening: true } })} />
    <div id="platform-signal" className="section-heading dashboard-heading"><div><div className="eyebrow">WORKSPACE OVERVIEW</div><h2>Screening command center</h2><p>Operational data appears here after the real screening service returns results.</p></div><span className="status warn"><Radio size={14}/> {error ? "API unavailable" : data ? "Measured data" : "Connecting"}</span></div>
    {error ? <Unavailable title="Analytics unavailable" message={error}/> : !data ? <Loading /> : <>
    <div className="metrics">
      <Metric icon={ScanEye} label="Total screenings" value={data.totals.screenings.toLocaleString()} hint="Recorded results"/>
      <Metric icon={Zap} label="Today" value={data.totals.today} hint="Recorded today"/>
      <Metric icon={AlertTriangle} label="Referable cases" value={data.totals.referable} hint="Level 2–4"/>
      <Metric icon={ClipboardCheck} label="Pending review" value={data.totals.pending} hint="Human review queue"/>
      <Metric icon={RefreshCw} label="Poor quality" value={data.totals.poor} hint="Recapture recommended"/>
      <Metric icon={Activity} label="Avg processing" value={data.totals.avgTime} hint="Demo pipeline"/>
    </div>
    <div className="grid-2">
      <div className="card chart-card"><div className="card-head"><div><b>Screening volume</b><span>Last 7 days</span></div><Activity size={18}/></div><MiniBars data={data.volume}/></div>
      <div className="card chart-card"><div className="card-head"><div><b>DR severity distribution</b><span>Recorded results</span></div><BrainCircuit size={18}/></div><SeverityBars data={data.severity}/></div>
    </div>
    <div className="card table-card"><div className="card-head"><div><b>Recent screenings</b><span>Latest activity</span></div><button className="ghost" onClick={() => nav("/history")}>View history <ChevronRight size={15}/></button></div><HistoryTable compact /></div>
    </>}
  </>;
}

function MiniBars({data}) {
  const max = Math.max(1, ...data.map(x => x.value));
  return <div className="bars">{data.map(x => <div className="bar-col" key={x.day}><div className="bar" style={{height:`${Math.max(14,x.value/max*145)}px`}}/><span>{x.day}</span></div>)}</div>;
}
function SeverityBars({data}) {
  const max = Math.max(1, ...data.map(x=>x.value));
  return <div className="severity-bars">{data.map((x,i)=><div className="srow" key={x.name}><span>{x.name}</span><div><i style={{width:`${x.value/max*100}%`}}/></div><b>{x.value}</b></div>)}</div>;
}

function Loading() { return <div className="loading card"><div className="spinner"/><b>Loading workspace…</b></div>; }
function Unavailable({title="Module not configured", message="Connect the backend or configure this module to continue."}) { return <div className="unavailable card"><AlertTriangle size={25}/><div><b>{title}</b><p>{message}</p><small>No clinical or model data is shown until a configured service returns it.</small></div></div>; }

function ScreeningStepper({step}) {
  const steps = ["Patient", "Upload", "Quality", "AI analysis", "Explain", "Review"];
  return <div className="screening-stepper" aria-label="Screening workflow">{steps.map((label, index) => {
    const number = index + 1;
    const state = number < step ? "complete" : number === step ? "current" : "pending";
    return <div className={`screening-step ${state}`} key={label}><span>{state === "complete" ? <CheckCircle2 size={14}/> : String(number).padStart(2, "0")}</span><b>{label}</b>{number < steps.length && <i/>}</div>;
  })}</div>;
}

function Screening() {
  const { id } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  const choose = (f) => {
    if (!f) return;
    if (!["image/jpeg","image/png","image/jpg"].includes(f.type)) return alert("Please select a JPG or PNG image.");
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(f); setResult(null); setError(""); setPreview(URL.createObjectURL(f));
  };
  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      if (location.state?.newScreening) {
        sessionStorage.removeItem(screeningStorageKey);
        if (!cancelled) {
          setFile(null); setPreview(""); setResult(null); setError("");
        }
        nav("/screening", { replace: true, state: null });
        return;
      }

      const stored = getStoredScreening();
      if (!id && stored?.screeningId) {
        nav(`/screening/${stored.screeningId}`, { replace: true });
        return;
      }
      if (!id) return;

      try {
        let restored;
        try {
          restored = await getScreening(id);
        } catch {
          const response = await fetch(`/results/${id}/result.json`);
          if (!response.ok) throw new Error("Screening result not found.");
          restored = await response.json();
        }
        if (!cancelled) {
          sessionStorage.setItem(screeningStorageKey, JSON.stringify(restored));
          setResult(restored);
          setPreview(`/results/${id}/original.png`);
          setFile(null);
          setError("");
        }
      } catch (restoreError) {
        if (!cancelled) setError(restoreError.message);
      }
    };
    restore();
    return () => { cancelled = true; };
  }, [id, location.state, nav]);
  const startNew = () => {
    sessionStorage.removeItem(screeningStorageKey);
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(null); setPreview(""); setResult(null); setError("");
    nav("/screening", { replace: true });
  };
  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const r = await analyzeImage(file);
      sessionStorage.setItem(screeningStorageKey, JSON.stringify(r));
      setResult(r);
      nav(`/screening/${r.screeningId}`);
    } catch (analysisError) {
      setError(analysisError.message || "The screening service could not analyze this image.");
    } finally {
      setBusy(false);
    }
  };
  const workflowStep = result ? 5 : busy ? 4 : file ? 3 : 2;
  return <>
    <PageTitle eyebrow="SCREENING" title="Fundus image screening" text="Upload a retinal image, run quality checks, and review the explainable AI result." action={<button className="secondary" onClick={startNew}><RefreshCw size={17}/> New screening</button>} />
    <ScreeningStepper step={workflowStep}/>
    <div className="screening-layout">
      <div>
        <div className="card upload-card">
          <div className="card-head"><div><b>1. Upload fundus image</b><span>JPG or PNG · Use a patient ID, not a name</span></div><Upload size={19}/></div>
          <div className={drag ? "dropzone drag" : "dropzone"} onDragOver={(e)=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={(e)=>{e.preventDefault();setDrag(false);choose(e.dataTransfer.files[0])}}>
            <input id="file" type="file" accept="image/jpeg,image/png" onChange={(e)=>choose(e.target.files[0])}/>
            <label htmlFor="file"><div className="upload-icon"><Upload/></div><b>Drop fundus image here</b><span>or click to browse</span></label>
          </div>
          <button className="primary full" disabled={!file || busy} onClick={run}>{busy ? <><div className="mini-spinner"/> Analyzing…</> : <><Sparkles size={17}/> Analyze image</>}</button>
          {file && <div className="file-row"><CheckCircle2 size={16}/><span>{file.name}</span><small>{Math.round(file.size/1024)} KB</small></div>}
          {error && <div className="form-error" role="alert"><AlertTriangle size={16}/>{error}</div>}
        </div>
        {busy && <Processing/>}
      </div>
      <div className="card image-card">
        <div className="card-head"><div><b>2. Image preview</b><span>Original fundus image</span></div><ScanEye size={19}/></div>
        <div className={busy ? "image-frame scanning" : "image-frame"}>{preview ? <img src={preview} alt="Uploaded fundus preview"/> : <div className="empty-image"><ScanEye size={42}/><span>Upload an image to preview it</span></div>}{busy && <><div className="scan-grid"/><div className="scan-line"/><span className="scan-label"><i/> Request sent · awaiting backend</span></>}</div>
      </div>
    </div>
    {result && (result.quality.gradable === false ? <QualityRejected quality={result.quality} messages={result.messages}/> : <Result result={result} preview={preview}/>)}
  </>;
}

function QualityRejected({quality, messages = []}) {
  return <div className="result-section"><div className="unavailable card"><AlertTriangle size={25}/><div><b>Screening result unavailable because the retinal image is not gradable.</b><p>Quality score: {quality.score ?? "Unavailable"}/100. {messages.length ? messages.join(" ") : "Recapture the image following the quality guidance from the screening service."}</p><small>No AI prediction was requested for this image.</small></div></div></div>;
}

function Processing() {
  return <div className="card processing"><div className="processing-line"><span className="pulse"/><div><b>Screening request in progress</b><small>The backend controls quality, inference, and explainability stages.</small></div></div><div className="pipeline"><div className="step active"><span><Radio size={10}/></span>Awaiting backend response</div><div className="step"><span>2</span>Result validation</div><div className="step"><span>3</span>Report ready</div></div></div>;
}

function Result({result, preview}) {
  const nav = useNavigate();
  const p = { level: result.level, severity: result.prediction, confidence: result.confidence };
  return <div className="result-section">
    <div className="section-heading"><div><div className="eyebrow">SCREENING RESULT</div><h2>AI-assisted result</h2></div><span className="status good"><CheckCircle2 size={15}/> Model inference complete</span></div>
    <div className="result-grid">
      <div className="card result-main">
        <div className="result-top"><div><span className="muted">DR severity</span><h2>Level {p.level} · {p.severity}</h2></div><div className="confidence"><span>Confidence</span><strong>{Math.round(p.confidence*100)}%</strong></div></div>
        <div className="result-metrics">
          <div><span>Image quality</span><b>{result.quality.status || "GRADABLE"}</b><small>{result.quality.score}% quality score</small></div>
          <div><span>Referable DR</span><b>{result.referable ? "YES" : "NO"}</b><small>Level 2–4 threshold</small></div>
          <div><span>Recommendation</span><b>{result.referable ? "REFER" : "ROUTINE"}</b><small>{result.recommendation || "Human review according to local clinical protocol."}</small></div>
        </div>
        <div className="disclaimer"><ShieldCheck size={18}/><span>This is an AI-assisted screening result and is not a substitute for professional medical diagnosis.</span></div>
        <div className="actions"><button className="primary" onClick={()=>nav(`/explainability/${result.screeningId}`)}><Sparkles size={17}/> View explanation</button><button className="secondary" onClick={()=>nav(`/report/${result.screeningId}`)}><FileText size={17}/> Generate report</button><button className="secondary" onClick={()=>nav(`/review/${result.screeningId}`)}><Send size={17}/> Human review</button></div>
      </div>
      <div className="card quality-card"><div className="card-head"><div><b>Quality gate</b><span>Pre-screening checks</span></div><Gauge size={19}/></div>
        {Object.entries({Focus:result.quality.focus,Brightness:result.quality.brightness,Illumination:result.quality.illumination,"Retinal area":result.quality.retinalArea}).map(([k,v])=><div className="score" key={k}><div><span>{k}</span><b>{v}%</b></div><div className="track"><i style={{width:`${v}%`}}/></div></div>)}
      </div>
    </div>
    <div className="grid-2">
      <div className="card image-card"><div className="card-head"><div><b>Original</b><span>Uploaded image</span></div></div><div className="image-frame small">{preview ? <img src={preview} alt="Original"/> : <div className="empty-image">No image</div>}</div></div>
      <div className="card image-card"><div className="card-head"><div><b>Enhanced</b><span>Backend-generated preprocessing output</span></div></div><div className="image-frame small">{result.assets?.enhancedImage ? <img src={result.assets.enhancedImage} alt="Enhanced fundus image"/> : <div className="empty-image"><ScanEye size={32}/><span>Enhanced image asset was not returned by the backend.</span></div>}</div></div>
    </div>
    <div className="card quality-card"><div className="card-head"><div><b>Model probability distribution</b><span>Actual model output; {result.confidenceCalibration || "uncalibrated"} confidence</span></div><BarChart3 size={19}/></div><ProbabilityBars probabilities={result.probabilities}/></div>
  </div>;
}
function ProbabilityBars({probabilities}) { return <div className="evidence-list">{severity.map((label,index)=>{const value=Number(probabilities[index] ?? probabilities[String(index)]); return <Evidence key={label} label={label} value={`${Math.max(0,Math.min(100,value*100)).toFixed(1)}%`}/>;})}</div>; }

function GradCamAsset({src, alt, className, style}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className="empty-image gradcam-unavailable"><ScanEye size={24}/><span>Model evidence map is currently unavailable for this screening.</span></div>;
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setFailed(true)} />;
}

function Explainability() {
  const { id } = useParams();
  const nav = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const screeningId = id || getStoredScreening()?.screeningId;
    if (!id && screeningId) {
      nav(`/explainability/${screeningId}`, { replace: true });
      return;
    }
    if (screeningId) {
      getScreening(screeningId)
        .catch(() => fetch(`/results/${screeningId}/result.json`).then(res => res.json()))
        .then(data => {
          if (data && (data.status === "success" || data.screeningId)) {
            setResult(data);
            sessionStorage.setItem(screeningStorageKey, JSON.stringify(data));
          } else {
            throw new Error("Screening result not found.");
          }
        })
        .catch(e => setError(e.message));
    } else {
      setError("No screening selected.");
    }
  }, [id, nav]);

  if (error) return <Unavailable title="Explainability unavailable" message={error}/>;
  if (!result) return <div style={{padding: '2rem'}}>Loading...</div>;
  if (result.quality?.gradable === false) return <Unavailable title="Explainability unavailable" message="Complete a gradable screening before opening model evidence."/>;

  const overlay = result.assets?.gradcamOverlay;
  const confidenceValue = result.confidence > 1 ? result.confidence : Math.round(result.confidence * 100);

  const explainPrediction = () => {
    if (result.level === 0) return "The AI detected no significant signs of diabetic retinopathy. The retina appears healthy.";
    if (result.level === 1) return "The AI detected early signs of mild diabetic retinopathy. Regular monitoring is advised.";
    if (result.level === 2) return "The AI detected moderate diabetic retinopathy. Clinical review is necessary.";
    if (result.level === 3) return "The AI detected severe diabetic retinopathy. Urgent clinical attention is required.";
    if (result.level === 4) return "The AI detected proliferative diabetic retinopathy, an advanced stage requiring immediate medical intervention.";
    return "The AI provided a prediction that requires clinical interpretation.";
  };

  const activeId = result.screeningId || id || getStoredScreening()?.screeningId;

  return <><PageTitle
      eyebrow="EXPLAINABLE AI"
      title="Why did the model predict this?"
      text="Feature-based model evidence map highlighting regions that contributed strongly to the model's assessment."
      action={
        activeId ? (
          <button className="secondary" onClick={() => nav(`/screening/${activeId}`)}>
            <ArrowLeft size={17} /> Back to Result
          </button>
        ) : null
      }
    />
    <div className="grid-2">
      <div className="card heatmap-card"><div className="card-head"><div><b>MODEL EVIDENCE MAP</b><span>Backend-generated feature evidence overlay</span></div><Sparkles size={19}/></div><div className="heatmap"><GradCamAsset src={overlay} alt="Model Evidence Map overlay"/></div><div className="legend" style={{display: 'flex', gap: '15px', marginTop: '10px', fontSize: '11px', color: '#64748b'}}><span><i className="hot" style={{display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444', marginRight: '4px'}}/>High model evidence</span><span><i style={{display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: '#eab308', marginRight: '4px'}}/>Moderate evidence</span><span><i className="cool" style={{display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: '#38bdf8', marginRight: '4px'}}/>Low evidence</span></div><p style={{fontSize: '11px', color: '#64748b', marginTop: '12px', lineHeight: 1.5, borderTop: '1px solid #edf2f7', paddingTop: '10px'}}>Highlighted regions represent areas containing visual features that contributed most strongly to the model's assessment. This is a feature-based model evidence map, not Grad-CAM.</p></div>
      <div className="card explanation"><div className="card-head"><div><b>Model explanation</b><span>Screening evidence</span></div></div>
        <div className="big-result"><span>Prediction</span><strong>Level {result.level} · {result.prediction || severity[result.level] || 'Unknown'}</strong><em>{confidenceValue}% confidence</em></div>
        <div style={{margin: '1rem 0', padding: '1rem', background: '#f8f9fa', borderRadius: '4px', borderLeft: '4px solid #0066cc'}}>
          <b>What does this mean?</b>
          <p style={{margin: '0.5rem 0 0 0', lineHeight: 1.5}}>{explainPrediction()}</p>
        </div>
        <div className="evidence-list">
          <Evidence label="Model confidence" value={`${confidenceValue}%`}/>
          <Evidence label="Image quality" value={`${result.quality?.status || 'GRADABLE'} · ${result.quality?.score || 100}%`}/>
          <Evidence label="Referable threshold" value={result.referable ? "YES" : "NO"}/>
          <Evidence label="Recommendation" value={result.recommendation || "Human review according to local clinical protocol."}/>
        </div>
        <div className="disclaimer" style={{marginTop: '1.5rem'}}><ShieldCheck size={18}/><span><b>Important:</b> This is an AI-assisted screening result and is not a substitute for professional medical diagnosis. Candidate regions are model evidence, not confirmed clinical lesions.</span></div>
      </div>
    </div>
  </>;
}
function Evidence({label,value}) { return <div className="evidence"><div><span>{label}</span><b>{value}</b></div><div className="track"><i style={{width:value}}/></div></div>; }

function History() {
  const [query, setQuery] = useState("");
  const [review, setReview] = useState("All review status");
  const [level, setLevel] = useState("All severity");
  return <><PageTitle eyebrow="RECORDS" title="Patient screening history" text="Search and review previous screening records using patient IDs." /><div className="card table-card"><div className="filters"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search patient or screening ID" aria-label="Search screening history"/><select value={review} onChange={e=>setReview(e.target.value)} aria-label="Filter by review status"><option>All review status</option><option>Pending</option><option>Completed</option></select><select value={level} onChange={e=>setLevel(e.target.value)} aria-label="Filter by severity"><option>All severity</option>{severity.map(x=><option key={x}>{x}</option>)}</select></div><HistoryTable filters={{query,review,level}}/></div></>;
}
function HistoryTable({compact=false, filters}) {
  const [rows,setRows]=useState([]);
  const [error,setError]=useState("");
  const nav=useNavigate();
  useEffect(()=>{getHistory().then(setRows).catch(e=>setError(e.message))},[]);
  if (error) return <Unavailable title="Screening history unavailable" message={error}/>;
  const visibleRows = rows.filter(r => {
    const matchesQuery = !filters?.query || r.id.toLowerCase().includes(filters.query.toLowerCase());
    const matchesReview = !filters?.review || filters.review === "All review status" || r.review === filters.review;
    const matchesLevel = !filters?.level || filters.level === "All severity" || severity[r.level] === filters.level;
    return matchesQuery && matchesReview && matchesLevel;
  });
  return <div className="table-wrap"><table><thead><tr><th>Screening ID</th><th>Date</th><th>Quality</th><th>DR Level</th><th>Confidence</th><th>Referable</th><th>Review</th><th></th></tr></thead><tbody>{visibleRows.slice(0,compact?5:8).map(r=><tr key={r.id}><td><b>{r.id}</b></td><td>{r.date}</td><td><span className={`status ${r.quality==="GOOD"?"good":"warn"}`}>{r.quality}</span></td><td>Level {r.level}</td><td>{r.confidence}%</td><td>{r.referable?"YES":"NO"}</td><td>{r.review}</td><td><button className="icon-btn" aria-label={`Review ${r.id}`} onClick={()=>nav(`/review/${r.id}`)}><ChevronRight/></button></td></tr>)}{rows.length > 0 && visibleRows.length === 0 && <tr><td colSpan="8" className="empty-table">No screenings match these filters.</td></tr>}</tbody></table></div>;
}

function Analytics() {
  const [data,setData]=useState(null); const [error,setError]=useState(""); useEffect(()=>{getAnalytics().then(setData).catch(e=>setError(e.message))},[]);
  if(error) return <Unavailable title="No evaluation results available yet" message={error}/>;
  if(!data) return <Loading/>;
  return <><PageTitle eyebrow="ANALYTICS" title="Screening analytics" text="Operational metrics for the prototype screening program."/><div className="metrics"><Metric icon={ScanEye} label="Screenings" value={data.totals.screenings.toLocaleString()} hint="Recorded results"/><Metric icon={AlertTriangle} label="Referable" value={data.totals.referable} hint={`${(data.referableRate * 100).toFixed(1)}% of screenings`}/><Metric icon={RefreshCw} label="Poor quality" value={data.totals.poor} hint={`${((1 - data.qualityRate) * 100).toFixed(1)}% of screenings`}/><Metric icon={ClipboardCheck} label="Human review" value={data.totals.pending} hint="Pending queue"/></div><div className="grid-2"><div className="card chart-card"><div className="card-head"><div><b>Weekly volume</b><span>Screenings</span></div></div><MiniBars data={data.volume}/></div><div className="card chart-card"><div className="card-head"><div><b>Severity distribution</b><span>Levels 0–4</span></div></div><SeverityBars data={data.severity}/></div></div><div className="card insight"><Sparkles/><div><b>Interpretation</b><p>These metrics summarize recorded screening responses. Model performance metrics should come from your held-out test set, not from operational screening volume.</p></div></div></>;
}

function Rural() {
  const centers = [
    {name:"Kolar Rural Center", district:"Karnataka", capacity:"40/day", connectivity:"Online", reviewer:"Configured"},
    {name:"Raichur Outreach", district:"Karnataka", capacity:"24/day", connectivity:"Limited", reviewer:"Planned"},
    {name:"Chitradurga PHC", district:"Karnataka", capacity:"32/day", connectivity:"Online", reviewer:"Configured"},
    {name:"Bidar Mobile Unit", district:"Karnataka", capacity:"16/day", connectivity:"Offline", reviewer:"Planned"}
  ];
  return <><PageTitle eyebrow="RURAL DEPLOYMENT" title="Rural screening network" text="A planning view for center capacity and connectivity. Live center data is not connected in this build." action={<span className="demo-badge"><Network size={12}/> PLANNING DATA</span>}/><div className="planning-banner card"><Network size={20}/><div><b>Planning configuration, not live clinical data</b><p>These center profiles describe a deployment scenario only. Connect a secured center service before showing patient counts, queues, or clinical activity.</p></div></div><div className="metrics"><Metric icon={Network} label="Centers configured" value={centers.length} hint="Planning scenario"/><Metric icon={Zap} label="Capture capacity" value="112/day" hint="Configured target"/><Metric icon={Radio} label="Online links" value="2 / 4" hint="Connectivity plan"/><Metric icon={ClipboardCheck} label="Review model" value="Human-led" hint="No automated referral"/></div><div className="center-grid">{centers.map(center=><div className="card center" key={center.name}><div className="center-top"><div className="center-icon"><HeartPulse/></div><span className={`status ${center.connectivity==="Online"?"good":center.connectivity==="Limited"?"warn":"bad"}`}>{center.connectivity}</span></div><h3>{center.name}</h3><span className="center-district">{center.district} · planning profile</span><div className="center-stats"><span><b>{center.capacity}</b> capture target</span><span><b>{center.reviewer}</b> reviewer</span></div></div>)}</div></>;
}

function Simulation() {
  const [patients,setPatients]=useState(100000); const s=useMemo(()=>getSimulation(patients),[patients]);
  return <><PageTitle eyebrow="SIMULINK CONCEPT" title="Rural screening simulation" text="Frontend visualization of the system-level model. Use Simulink for the validated simulation and final quantitative claims." action={<select className="year-select" value={patients} onChange={e=>setPatients(+e.target.value)}><option value={10000}>10,000 / year</option><option value={50000}>50,000 / year</option><option value={100000}>100,000 / year</option><option value={150000}>150,000 / year</option></select>}/><div className="simulation-flow card"><FlowNode icon={Users} title="Rural patients" value={`${s.arrivalPerDay}/day`}/><ChevronRight/><FlowNode icon={ScanEye} title="Fundus capture" value="Image intake"/><ChevronRight/><FlowNode icon={BrainCircuit} title="AI processing" value={`${s.processingSeconds}s/image`}/><ChevronRight/><FlowNode icon={ClipboardCheck} title="Human review" value={`${s.reviewerCapacity}/day`}/><ChevronRight/><FlowNode icon={HeartPulse} title="Referral" value="Level 2–4"/></div><div className="metrics"><Metric icon={Users} label="Annual patients" value={patients.toLocaleString()} hint="Scenario"/><Metric icon={Zap} label="AI capacity" value={`${s.aiCapacity}/day`} hint="Configuration"/><Metric icon={ClipboardCheck} label="Reviewer capacity" value={`${s.reviewerCapacity}/day`} hint="Configuration"/><Metric icon={Gauge} label="System utilization" value={`${s.utilization}%`} hint="AI stage"/></div><div className="grid-2"><div className="card chart-card"><div className="card-head"><div><b>Capacity indicators</b><span>Scenario estimate</span></div></div><div className="capacity"><Cap label="Arrival load" value={Math.min(100,Math.round(s.arrivalPerDay/s.aiCapacity*100))}/><Cap label="Reviewer load" value={Math.min(100,Math.round(s.arrivalPerDay/s.reviewerCapacity*100))}/><Cap label="Network overhead" value={Math.round(s.networkDelay*10)}/></div></div><div className="card chart-card"><div className="card-head"><div><b>Queue & waiting</b><span>Scenario estimate</span></div></div><div className="big-stats"><div><span>Queue</span><b>{s.queue}</b><small>cases/day</small></div><div><span>Avg waiting</span><b>{s.waitingMinutes} min</b><small>estimated</small></div><div><span>Network delay</span><b>{s.networkDelay}s</b><small>scenario assumption</small></div></div></div></div><div className="insight card"><Gauge/><div><b>Important</b><p>This page is a UI representation of the Simulink concept. Build and validate the actual queue/throughput model in Simulink before presenting numerical results as research findings.</p></div></div></>;
}
function FlowNode({icon:Icon,title,value}) { return <div className="flow-node"><div><Icon size={19}/></div><b>{title}</b><span>{value}</span></div>; }
function Cap({label,value}) { return <div className="cap"><div><span>{label}</span><b>{value}%</b></div><div className="track"><i style={{width:`${Math.min(100,value)}%`}}/></div></div>; }

function Review() {
  const { id: selectedId } = useParams();
  const navigate = useNavigate();
  const [reviewerName, setReviewerName] = useState("Dr. R. Sharma, MD (Ophthalmology)");
  const [notes, setNotes] = useState("");
  const [modifiedLevel, setModifiedLevel] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [screenings, setScreenings] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchQueue = () => {
    getHistory().then(setScreenings).catch(console.error);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      const stored = getStoredScreening();
      if (stored?.screeningId) {
        navigate(`/review/${stored.screeningId}`, { replace: true });
        return;
      }
    }
    if (selectedId) {
      getScreening(selectedId)
        .catch(() => fetch(`/results/${selectedId}/result.json`).then(res => res.json()))
        .then(data => {
          setSelectedCase(data);
          const initialModLevel = typeof data.review === "object" && typeof data.review.modifiedLevel === "number" ? data.review.modifiedLevel : (data.level ?? 0);
          setModifiedLevel(initialModLevel);
          if (data.review?.notes) setNotes(data.review.notes);
          else setNotes("");
          if (data.review?.reviewerName) setReviewerName(data.review.reviewerName);
          sessionStorage.setItem(screeningStorageKey, JSON.stringify(data));
        })
        .catch(e => {
          console.error(e);
          const found = screenings.find(s => s.id === selectedId);
          if (found) {
            setSelectedCase(found);
            setModifiedLevel(found.level ?? 0);
          }
        });
    } else {
      setSelectedCase(null);
    }
  }, [selectedId, screenings, navigate]);

  const handleAction = async (intendedStatus) => {
    if (!selectedId || !selectedCase) return;
    try {
      const isSameAsAI = modifiedLevel === selectedCase.level;
      let finalStatus = intendedStatus;
      if (intendedStatus === "Modified" && isSameAsAI) {
        finalStatus = "Accepted";
      }

      let defaultNote = "Clinician confirmed the AI assessment.";
      if (finalStatus === "Modified") {
        defaultNote = `Clinician override: severity reassessed as Level ${modifiedLevel} (${severity[modifiedLevel]}).`;
      } else if (finalStatus === "Needs Further Review") {
        defaultNote = "Flagged for further specialist evaluation.";
      }

      const finalNotes = notes.trim() || defaultNote;

      const payload = {
        status: finalStatus,
        notes: finalNotes,
        reviewerName: reviewerName.trim() || "Dr. R. Sharma, MD (Ophthalmology)",
        modifiedLevel: finalStatus === "Modified" ? modifiedLevel : selectedCase.level,
        modifiedPrediction: finalStatus === "Modified" ? severity[modifiedLevel] : (selectedCase.prediction || severity[selectedCase.level])
      };

      await postReview(selectedId, payload);
      const actionLabel = finalStatus === "Accepted" ? "Accepted AI Result" : finalStatus === "Modified" ? "Doctor Override / Modified Result" : "Needs Further Review";
      setStatusMessage(`Clinical review saved: ${actionLabel}`);

      setSelectedCase(prev => ({
        ...prev,
        review: payload
      }));
      setNotes(finalNotes);
      fetchQueue();
      setTimeout(() => setStatusMessage(""), 5000);
    } catch (e) {
      setStatusMessage(`Error submitting review: ${e.message}`);
    }
  };

  const pendingCases = screenings.filter(x => {
    const st = typeof x.review === "object" ? x.review?.status : x.review;
    return !st || st === "Pending" || st === "Needs Further Review";
  });

  const reviewData = typeof selectedCase?.review === "object" ? selectedCase.review : null;
  const reviewStatus = reviewData?.status || (typeof selectedCase?.review === "string" ? selectedCase.review : "Pending");
  const badgeClass = reviewStatus === "Accepted" ? "good" : reviewStatus === "Modified" ? "warn" : reviewStatus === "Needs Further Review" ? "bad" : "warn";

  const activeScreeningId = selectedId || selectedCase?.screeningId || getStoredScreening()?.screeningId;
  const isSameAsAI = selectedCase ? modifiedLevel === selectedCase.level : true;

  return <><PageTitle
      eyebrow="HUMAN REVIEW"
      title="Clinical review workspace"
      text="Review AI-assisted screening output, confirm findings, or override predictions with doctor rationale."
      action={
        activeScreeningId ? (
          <button className="secondary" onClick={() => navigate(`/screening/${activeScreeningId}`)}>
            <ArrowLeft size={17} /> Back to Result
          </button>
        ) : null
      }
    />
    {statusMessage && <div className="card" style={{padding: '1rem', marginBottom: '1rem', background: '#e6ffe6', color: '#006600', border: '1px solid #00cc00', borderRadius: '8px', fontWeight: 600}}><CheckCircle2 size={16} inline style={{marginRight: 6}}/>{statusMessage}</div>}
    <div className="review-layout">
      <div className="card review-list">
        <div className="card-head"><div><b>Pending cases</b><span>{pendingCases.length} requiring review</span></div><ClipboardCheck/></div>
        {pendingCases.length === 0 ? (
          <div style={{padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '12px'}}>
            No pending cases requiring review.
          </div>
        ) : (
          pendingCases.map((x) => {
            const st = typeof x.review === "object" ? x.review?.status : x.review || "Pending";
            const badgeColor = st === "Needs Further Review" ? "#dc2626" : "#d97706";
            return (
              <button className={`case ${x.id === selectedId ? 'active' : ''}`} key={x.id} onClick={() => navigate(`/review/${x.id}`)}>
                <div className="case-thumb"><ScanEye/></div>
                <div>
                  <b>{x.id}</b>
                  <span>Level {x.level} · {x.confidence}% · <em style={{fontStyle:'normal', fontWeight: 700, color: badgeColor}}>{st}</em></span>
                </div>
                <ChevronRight/>
              </button>
            );
          })
        )}
      </div>
      <div className="card reviewer">
        <div className="card-head">
          <div><b>Reviewer workspace</b><span>{selectedId ? `Screening ID: ${selectedId}` : "Select a case from the queue"}</span></div>
          <span className={`status ${badgeClass}`}>{reviewStatus.toUpperCase()}</span>
        </div>
        {selectedCase ? (
          <>
            <div className="review-image" style={{display: 'flex', justifyContent: 'center', background: '#0d1117', borderRadius: '10px', overflow: 'hidden', padding: '10px'}}>
              <img src={getResultImageUrl(selectedId, "original.png")} alt="Original fundus image" style={{maxWidth: '100%', maxHeight: '350px', objectFit: 'contain'}}/>
            </div>
            <div className="review-result">
              <div><span>AI prediction</span><b>Level {selectedCase.level} · {selectedCase.prediction || severity[selectedCase.level] || 'Unknown'}</b></div>
              <div><span>Confidence</span><b>{selectedCase.confidence !== undefined ? (selectedCase.confidence > 1 ? selectedCase.confidence : Math.round(selectedCase.confidence * 100)) : 0}%</b></div>
              <div><span>Referable DR</span><b>{selectedCase.referable ? "YES" : "NO"}</b></div>
              <div><span>Image quality</span><b>{selectedCase.quality?.status || "GRADABLE"}</b></div>
              <div><span>Current status</span><b>{reviewStatus}</b></div>
            </div>

            <div style={{margin: '12px 0', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px'}}>
              <label style={{fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px'}}>Reviewing Clinician / Doctor Name</label>
              <input type="text" value={reviewerName} onChange={e => setReviewerName(e.target.value)} placeholder="e.g. Dr. R. Sharma, MD (Ophthalmology)" style={{width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px'}} />
            </div>

            <div style={{margin: '12px 0', padding: '14px', background: isSameAsAI ? '#f0fdf4' : '#fffbeb', border: '1px solid', borderColor: isSameAsAI ? '#bbf7d0' : '#fcd34d', borderRadius: '8px'}}>
              <b style={{fontSize: '12px', color: isSameAsAI ? '#166534' : '#92400e', display: 'block', marginBottom: '4px'}}>
                {isSameAsAI ? "Doctor Severity Assessment (Matches AI Prediction)" : "Doctor Severity Override"}
              </b>
              <p style={{fontSize: '11px', color: isSameAsAI ? '#15803d' : '#b45309', margin: '0 0 10px 0'}}>
                {isSameAsAI ? `Selected Level ${modifiedLevel} matches the AI prediction.` : "Select the corrected Diabetic Retinopathy severity level based on clinical judgment:"}
              </p>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                {severity.map((label, idx) => {
                  const isSelected = modifiedLevel === idx;
                  const matchesAI = idx === selectedCase.level;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setModifiedLevel(idx)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: isSelected ? (matchesAI ? '#16a34a' : '#0b5fff') : '#cbd5e1',
                        background: isSelected ? (matchesAI ? '#16a34a' : '#0b5fff') : '#fff',
                        color: isSelected ? '#fff' : '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      Level {idx} ({label}) {matchesAI ? " [AI]" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea placeholder="Add clinical rationale, fundus lesion observations, or doctor recommendations…" value={notes} onChange={e => setNotes(e.target.value)} style={{marginTop: '10px'}} />
            
            <div className="actions" style={{marginTop: '15px'}}>
              <button className="primary" onClick={() => { setModifiedLevel(selectedCase.level); handleAction("Accepted"); }}>
                <CheckCircle2 size={16}/> Accept AI result
              </button>
              
              {isSameAsAI ? (
                <button className="secondary" onClick={() => handleAction("Accepted")}>
                  <CheckCircle2 size={16}/> Confirm AI assessment (Level {selectedCase.level})
                </button>
              ) : (
                <button className="secondary" onClick={() => handleAction("Modified")}>
                  <CheckCircle2 size={16}/> Save doctor override (Level {modifiedLevel})
                </button>
              )}

              <button className="secondary" onClick={() => handleAction("Needs Further Review")}>
                Needs further review
              </button>
            </div>

            {(() => {
              const aiLevel = selectedCase.level;
              const aiPrediction = selectedCase.prediction || severity[aiLevel] || 'Unknown';
              const aiConfidence = selectedCase.confidence !== undefined ? (selectedCase.confidence > 1 ? selectedCase.confidence : Math.round(selectedCase.confidence * 100)) : 0;

              let decisionText = "Awaiting Clinical Review";
              let docAssessmentText = "Not finalized";
              let defaultRationale = "Awaiting clinician evaluation.";

              if (reviewStatus === "Accepted") {
                decisionText = "Accepted AI Result";
                docAssessmentText = `Level ${aiLevel} – ${aiPrediction}`;
                defaultRationale = "Clinician confirmed the AI assessment.";
              } else if (reviewStatus === "Modified") {
                decisionText = "Doctor Override / Modified Result";
                const docLevel = typeof reviewData?.modifiedLevel === "number" ? reviewData.modifiedLevel : modifiedLevel;
                const docPred = reviewData?.modifiedPrediction || severity[docLevel] || `Level ${docLevel}`;
                docAssessmentText = `Level ${docLevel} – ${docPred}`;
                defaultRationale = `Clinician override: severity reassessed as Level ${docLevel} (${docPred}).`;
              } else if (reviewStatus === "Needs Further Review") {
                decisionText = "Needs Further Review";
                docAssessmentText = "Not finalized";
                defaultRationale = "Flagged for further specialist evaluation.";
              }

              const displayNotes = reviewData?.notes || notes || defaultRationale;
              const reviewer = reviewData?.reviewerName || reviewerName || "Dr. R. Sharma, MD (Ophthalmology)";
              const reviewedTimestamp = reviewData?.reviewedAt ? new Date(reviewData.reviewedAt).toLocaleString() : "Awaiting sign-off";

              return (
                <div className="clinical-summary-card" style={{marginTop: '24px', padding: '20px', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <ClipboardCheck size={18} style={{color: '#0b5fff'}} />
                      <b style={{fontSize: '13px', color: '#0f172a', letterSpacing: '0.5px'}}>CLINICAL REVIEW SUMMARY</b>
                    </div>
                    <span className={`status ${badgeClass}`}>{decisionText.toUpperCase()}</span>
                  </div>

                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px'}}>
                    <div style={{background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px'}}>
                      <span style={{fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px'}}>
                        AI ASSESSMENT
                      </span>
                      <b style={{fontSize: '13px', color: '#0f172a', display: 'block'}}>Level {aiLevel} – {aiPrediction}</b>
                      <small style={{fontSize: '11px', color: '#0b5fff', fontWeight: 600, display: 'block', marginTop: '2px'}}>{aiConfidence}% confidence</small>
                    </div>

                    <div style={{background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px'}}>
                      <span style={{fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px'}}>
                        DOCTOR ASSESSMENT
                      </span>
                      <b style={{fontSize: '13px', color: reviewStatus === "Needs Further Review" ? "#dc2626" : "#0f172a", display: 'block'}}>{docAssessmentText}</b>
                    </div>
                  </div>

                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px'}}>
                    <div>
                      <span style={{fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px'}}>DECISION</span>
                      <b style={{fontSize: '12px', color: '#1e293b', display: 'block'}}>{decisionText}</b>
                    </div>
                    <div>
                      <span style={{fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px'}}>REVIEWER</span>
                      <b style={{fontSize: '12px', color: '#1e293b', display: 'block'}}>{reviewer}</b>
                    </div>
                    <div>
                      <span style={{fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px'}}>REVIEWED</span>
                      <b style={{fontSize: '12px', color: '#1e293b', display: 'block'}}>{reviewedTimestamp}</b>
                    </div>
                  </div>

                  <div style={{background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px'}}>
                    <span style={{fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px'}}>CLINICAL RATIONALE</span>
                    <p style={{margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.5, fontStyle: 'italic'}}>
                      "{displayNotes}"
                    </p>
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <div style={{padding: '3rem 2rem', textAlign: 'center', color: '#64748b'}}>
            <ScanEye size={36} style={{marginBottom: 10, color: '#94a3b8'}}/>
            <p style={{margin: 0}}>Select a screening case from the queue on the left to perform clinical review.</p>
          </div>
        )}
      </div>
    </div>
  </>;
}

function Report() {
  const { id } = useParams();
  const nav = useNavigate();
  const [result, setResult] = useState(null);
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const screeningId = id || getStoredScreening()?.screeningId;
    if (!id && screeningId) {
      nav(`/report/${screeningId}`, { replace: true });
      return;
    }
    if (screeningId) {
      getScreening(screeningId)
        .catch(() => fetch(`/results/${screeningId}/result.json`).then(res => res.json()))
        .then(data => {
          if (data && (data.status === "success" || data.screeningId)) {
            setResult(data);
            sessionStorage.setItem(screeningStorageKey, JSON.stringify(data));
            if (data.review) setReview(data.review);
          } else {
            throw new Error("Screening result not found.");
          }
        })
        .catch(e => setError(e.message));

      fetch(`/api/screenings/${screeningId}/review`)
        .then(res => res.ok ? res.json() : null)
        .then(rev => { if (rev) setReview(rev); })
        .catch(() => {});
    } else {
      setError("No screening selected.");
    }
  }, [id, nav]);

  if (error) return <Unavailable title="Report unavailable" message={error}/>;
  if (!result) return <div style={{padding: '2rem'}}>Loading...</div>;
  if (result.quality?.gradable === false) return <Unavailable title="Report unavailable" message="Complete a gradable screening before generating a report."/>;

  const originalImg = id ? getResultImageUrl(id, "original.png") : (result.screeningId ? getResultImageUrl(result.screeningId, "original.png") : '');
  const enhancedImg = id ? getResultImageUrl(id, "enhanced.png") : (result.assets?.enhancedImage || (result.screeningId ? getResultImageUrl(result.screeningId, "enhanced.png") : ''));
  const gradcamImg = result.assets?.gradcamOverlay;
  const confidenceValue = result.confidence > 1 ? result.confidence : Math.round(result.confidence * 100);

  const displayLevel = review?.status === "Modified" && typeof review.modifiedLevel === "number" ? review.modifiedLevel : result.level;
  const displayPrediction = review?.status === "Modified" && review.modifiedPrediction ? review.modifiedPrediction : (result.prediction || severity[displayLevel]);

  const activeId = result.screeningId || id || getStoredScreening()?.screeningId;

  return <><PageTitle
      eyebrow="REPORT"
      title="Screening report"
      text="Official screening report preview generated with AI analysis and clinical sign-off."
      action={
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeId && (
            <button className="secondary no-print" onClick={() => nav(`/screening/${activeId}`)}>
              <ArrowLeft size={17} /> Back to Result
            </button>
          )}
          <button className="secondary no-print" onClick={() => window.print()}>
            <Download size={17} /> Print / Save PDF
          </button>
        </div>
      }
    />
    <div className="report card">
      <div className="report-head">
        <div className="report-logo"><ScanEye/><div><b>RetinaGuard AI</b><span>Diabetic Retinopathy Screening</span></div></div>
        <div><b>{result.screeningId}</b><span>{new Date().toLocaleDateString()}</span></div>
      </div>
      <div className="report-banner">
        <div><span>Final Diagnosis (AI + Doctor)</span><b>Level {displayLevel} · {displayPrediction}</b></div>
        <div><span>AI Confidence</span><b>{confidenceValue}%</b></div>
        <div><span>Referable DR</span><b>{result.referable ? "YES" : "NO"}</b></div>
      </div>

      {review && (
        <div style={{margin: '18px 0', padding: '14px', background: review.status === "Accepted" ? "#ecfdf5" : review.status === "Modified" ? "#fffbeb" : "#fef2f2", border: '1px solid', borderColor: review.status === "Accepted" ? "#a7f3d0" : review.status === "Modified" ? "#fde68a" : "#fecaca", borderRadius: '9px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
            <b style={{fontSize: '12px', color: review.status === "Accepted" ? "#065f46" : review.status === "Modified" ? "#92400e" : "#991b1b"}}>
              <CheckCircle2 size={14} inline style={{marginRight: 4}}/> CLINICAL SIGN-OFF: {review.status.toUpperCase()}
            </b>
            <span style={{fontSize: '10px', color: '#64748b'}}>{review.reviewedAt ? new Date(review.reviewedAt).toLocaleString() : ''}</span>
          </div>
          <p style={{margin: '4px 0', fontSize: '11px', color: '#334155'}}><b>Reviewing Doctor:</b> {review.reviewerName || "Dr. R. Sharma, MD"}</p>
          {review.notes && <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#475569', fontStyle: 'italic'}}>"{review.notes}"</p>}
        </div>
      )}

      <div className="report-grid">
        <div>
          <h3>Image quality</h3>
          <p>{result.quality?.status || "GRADABLE"} · {result.quality?.score || 100}% quality score</p>
          <h3>Recommendation</h3>
          <p>{result.recommendation || "Human review according to local clinical protocol."}</p>
          <h3>Evidence</h3>
          <ul>
            <li>Model confidence — {confidenceValue}%</li>
            <li>Referable threshold — {result.referable ? "YES" : "NO"}</li>
            <li>Clinical review status — {review?.status || "Pending review"}</li>
          </ul>
        </div>
      </div>

      <div className="report-images" style={{marginTop: '25px'}}>
        <h3>Screening Images</h3>
        <div className="report-images-grid">
          <div className="report-img-card">
            <h4>Original Fundus Image</h4>
            <div className="report-img-container">
              {originalImg ? <img src={originalImg} alt="Original Fundus" /> : <span style={{color: '#8994a4', fontSize: '11px'}}>Not available</span>}
            </div>
          </div>
          <div className="report-img-card">
            <h4>Enhanced Fundus Image</h4>
            <div className="report-img-container">
              {enhancedImg ? <img src={enhancedImg} alt="Enhanced Fundus" /> : <span style={{color: '#8994a4', fontSize: '11px'}}>Not available</span>}
            </div>
          </div>
          <div className="report-img-card">
            <h4>MODEL EVIDENCE MAP</h4>
            <div className="report-img-container" style={{background: gradcamImg ? '#0d1117' : '#f8f9fa'}}>
              <GradCamAsset src={gradcamImg} alt="Model Evidence Map" />
            </div>
            <div className="legend" style={{display: 'flex', gap: '8px', marginTop: '8px', fontSize: '9px', color: '#64748b', flexWrap: 'wrap'}}>
              <span><i style={{display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', marginRight: '3px'}}/>High model evidence</span>
              <span><i style={{display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#eab308', marginRight: '3px'}}/>Moderate evidence</span>
              <span><i style={{display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', marginRight: '3px'}}/>Low evidence</span>
            </div>
          </div>
        </div>
        <p style={{fontSize: '10px', color: '#64748b', marginTop: '10px', fontStyle: 'italic', lineHeight: 1.4}}>
          Highlighted regions represent areas containing visual features that contributed most strongly to the model's assessment. This is a feature-based model evidence map, not Grad-CAM.
        </p>
      </div>

      <div className="report-note" style={{marginTop: '25px'}}>
        <ShieldCheck/><span>This AI-assisted screening output is for decision support and subject to doctor review. Diagnostic decisions remain the responsibility of the examining clinician.</span>
      </div>
      <div className="signature" style={{marginTop: '45px'}}>
        <div>
          <b>{review?.reviewerName || "Dr. R. Sharma, MD"}</b>
          <span style={{display: 'block', fontSize: '9px', color: '#64748b'}}>Reviewing Ophthalmologist Signature</span>
        </div>
        <div>
          <b>{review?.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString() : new Date().toLocaleDateString()}</b>
          <span style={{display: 'block', fontSize: '9px', color: '#64748b'}}>Date & Time</span>
        </div>
      </div>
    </div>
  </>;
}

function About() {
  const stack = [
    "React + Vite (Frontend)",
    "Node.js + Express REST API (Backend)",
    "Python + Flask ML Service",
    "OpenCV + NumPy + scikit-learn",
    "RandomForestClassifier (90 features)",
    "File-based JSON storage",
    "Render Cloud Deployment"
  ];
  return <><PageTitle eyebrow="TECHNOLOGY" title="How the platform works" text="A decoupled microservice architecture connecting React frontend, Node.js API layer, and Python ML screening service."/><div className="architecture card"><div className="arch-node">Health worker / patient</div><ChevronRight/><div className="arch-node">React web app</div><ChevronRight/><div className="arch-node">Node.js Backend</div><ChevronRight/><div className="arch-node strong">Python Random Forest ML</div><ChevronRight/><div className="arch-node">Result + Evidence</div></div><div className="grid-2"><div className="card"><div className="card-head"><div><b>Technology stack</b><span>System Architecture</span></div></div><div className="stack">{stack.map(x=><div key={x}><CheckCircle2 size={17}/>{x}</div>)}</div></div><div className="card"><div className="card-head"><div><b>Clinical safety</b><span>Human-in-the-loop</span></div></div><div className="safety"><ShieldCheck size={28}/><h3>AI assists; clinicians decide</h3><p>The application is designed for screening support, image-quality gating, prioritization and explainability. It should not be presented as a standalone diagnostic device.</p></div></div></div></>;
}


function SettingsPage() { return <><PageTitle eyebrow="SETTINGS" title="Application settings" text="Backend and privacy configuration."/><div className="card settings"><div className="setting"><div><b>Clinical demo mode</b><span>Disabled. This frontend never generates simulated screening results.</span></div><span className="status good">Disabled</span></div><div className="setting"><div><b>API endpoint</b><span>Configure VITE_API_BASE_URL to connect a real screening backend.</span></div><span className="status warn">Not checked</span></div><div className="setting"><div><b>Privacy</b><span>Use patient IDs; do not add names or unnecessary personal information to uploads.</span></div><ShieldCheck/></div></div></>; }

function App() {
  const [dark,setDark]=useState(false);
  return <Layout dark={dark} setDark={setDark}><Routes>
    <Route path="/" element={<Dashboard/>}/>
    <Route path="/screening" element={<Screening/>}/>
    <Route path="/screening/:id" element={<Screening/>}/>
    <Route path="/explainability/:id" element={<Explainability/>}/>
    <Route path="/explainability" element={<Explainability/>}/>
    <Route path="/history" element={<History/>}/>
    <Route path="/analytics" element={<Analytics/>}/>
    <Route path="/rural" element={<Rural/>}/>
    <Route path="/simulation" element={<Simulation/>}/>
    <Route path="/review/:id" element={<Review/>}/>
    <Route path="/review" element={<Review/>}/>
    <Route path="/report/:id" element={<Report/>}/>
    <Route path="/report" element={<Report/>}/>
    <Route path="/about" element={<About/>}/>
    <Route path="/settings" element={<SettingsPage/>}/>
    <Route path="*" element={<Dashboard/>}/>
  </Routes></Layout>;
}
export default App;
