// pages/index.js
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Head from "next/head";

// ─── BMI UTILS ────────────────────────────────────────────────────────────────
function calcBMI(height, weight) {
  const h = parseFloat(height) / 100;
  const w = parseFloat(weight);
  if (!h || !w) return 0;
  return Math.round((w / (h * h)) * 10) / 10;
}

function bmiCategory(bmi, female = false) {
  const highN = female ? 24.0 : 25.0;
  const highO = female ? 29.0 : 30.0;
  if (bmi < 18.5) return { cat: "Недостаточный вес", col: "#60a5fa", fig: "🚶" };
  if (bmi < highN) return { cat: "Здоровый вес ✓", col: "#34d399", fig: "🏃" };
  if (bmi < highO) return { cat: "Избыточный вес", col: "#f59e0b", fig: "🚶" };
  return { cat: "Ожирение", col: "#f87171", fig: "🧍" };
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function useCountdown() {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = new Date("2026-06-15T08:00:00") - new Date();
      if (diff <= 0) { setTxt("🏁 Марафон уже состоялся!"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTxt(`⏱ До старта: ${d} дн. ${h} ч. ${m} мин. ${s} сек.`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return txt;
}

// ─── BMI CANVAS ───────────────────────────────────────────────────────────────
function BMIScale({ bmi }) {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, barH = 14, barY = 18, totalW = W - 24, x0 = 12;
    ctx.clearRect(0, 0, W, canvas.height);
    const segs = [
      { w: 0.23, c: "#60a5fa", l: "< 18.5" },
      { w: 0.28, c: "#34d399", l: "18.5–24" },
      { w: 0.22, c: "#f59e0b", l: "25–29" },
      { w: 0.27, c: "#f87171", l: "≥ 30" },
    ];
    let cx = x0;
    segs.forEach((s) => {
      const sw = Math.floor(totalW * s.w);
      ctx.fillStyle = bmi > 0 ? s.c : s.c + "66";
      ctx.fillRect(cx, barY, sw - 1, barH);
      cx += sw;
    });
    if (bmi > 0) {
      const pct = Math.min(Math.max((bmi - 14) / 28, 0.01), 0.99);
      const mx = x0 + Math.floor(totalW * pct);
      ctx.fillStyle = "#e8eaf6";
      ctx.beginPath();
      ctx.moveTo(mx - 6, barY - 3);
      ctx.lineTo(mx + 6, barY - 3);
      ctx.lineTo(mx, barY + barH + 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.font = "9px DM Sans,sans-serif";
    ctx.fillStyle = "#4a5075";
    ctx.textAlign = "center";
    cx = x0;
    segs.forEach((s) => {
      const sw = Math.floor(totalW * s.w);
      ctx.fillText(s.l, cx + sw / 2, barY + barH + 12);
      cx += sw;
    });
  }, [bmi]);
  return <canvas ref={ref} width={360} height={52} style={{ width: "100%", maxWidth: 360 }} />;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const countdown = useCountdown();

  const [modal, setModal] = useState(null); // 'register' | 'bmi' | 'users'
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastReg, setLastReg] = useState(null);

  // Register form
  const [form, setForm] = useState({ email: "", pass: "", pass2: "", first: "", last: "", gender: "Мужской", birth: "1990-06-15", country: "Kazakhstan" });
  const [errs, setErrs] = useState({});

  // BMI
  const [bmiData, setBmiData] = useState({ height: 170, weight: 70, age: 25, gender: "male" });
  const [bmiResult, setBmiResult] = useState(0);

  // Users filter
  const [filter, setFilter] = useState({ role: "", sort: "first", q: "" });

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // ── Load participants ──────────────────────────────────────────────────────
  const loadParticipants = async () => {
    const res = await fetch("/api/participants");
    if (res.ok) setParticipants(await res.json());
  };

  useEffect(() => {
    if (status === "authenticated") loadParticipants();
  }, [status]);

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    const e = {};
    if (!form.email.includes("@") || !form.email.includes(".")) e.email = "✕ Некорректный email";
    if (form.pass.length < 6) e.pass = "✕ Не менее 6 символов";
    if (form.pass !== form.pass2) e.pass2 = "✕ Пароли не совпадают";
    if (!form.first.trim()) e.first = "✕ Введите имя";
    if (!form.last.trim()) e.last = "✕ Введите фамилию";
    setErrs(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    const res = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, name: form.first, surname: form.last, gender: form.gender, dob: form.birth, country: form.country }),
    });
    setLoading(false);

    if (res.status === 409) { setErrs({ email: "✕ Email уже зарегистрирован" }); return; }
    if (!res.ok) { alert("Ошибка при регистрации"); return; }

    const data = await res.json();
    setLastReg(data);
    await loadParticipants();
    setBmiData((b) => ({ ...b, gender: form.gender === "Женский" ? "female" : "male" }));
    setModal("bmi");
  };

  // ── Save BMI ───────────────────────────────────────────────────────────────
  const handleSaveBMI = async () => {
    if (!bmiResult) { alert("Сначала рассчитайте BMI."); return; }
    if (lastReg) {
      await fetch(`/api/participants/${lastReg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bmi: bmiResult }),
      });
      await loadParticipants();
    }
    setModal("users");
  };

  // ── Filtered users ─────────────────────────────────────────────────────────
  const filtered = participants
    .filter((u) => !filter.role || u.role === filter.role)
    .filter((u) => !filter.q || [u.name, u.surname, u.email].some((s) => (s || "").toLowerCase().includes(filter.q.toLowerCase())))
    .sort((a, b) => {
      const k = { first: "name", last: "surname", email: "email", role: "role" }[filter.sort] || "first_name";
      return (a[k] || "").localeCompare(b[k] || "");
    });

  if (status === "loading" || status === "unauthenticated") {
    return <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6", fontFamily: "DM Sans, sans-serif" }}>Загрузка...</div>;
  }

  const bmiCat = bmiResult ? bmiCategory(bmiResult, bmiData.gender === "female") : null;
  const bmiIdealLow = bmiData.gender === "female" ? 45.5 + 2.3 * ((bmiData.height - 152.4) / 2.54) : 50 + 2.3 * ((bmiData.height - 152.4) / 2.54);
  const bmiFat = Math.max(0, bmiData.gender === "female" ? 1.2 * bmiResult + 0.23 * bmiData.age - 5.4 : 1.2 * bmiResult + 0.23 * bmiData.age - 16.2);

  return (
    <>
      <Head>
        <title>Marathon Skills 2026</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-logo">M</div>
        <span className="header-title">MARATHON SKILLS 2026</span>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => setModal("users")}>👥 Участники</button>
          <button className="btn btn-accent" onClick={() => setModal("register")}>✚ Регистрация</button>
          {/* User avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
            {session.user.image && <img src={session.user.image} alt="" style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #8b5cf6" }} />}
            <span style={{ color: "#e8eaf6", fontSize: 13, fontWeight: 600 }}>{session.user.name?.split(" ")[0]}</span>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => signOut({ callbackUrl: "/login" })}>Выйти</button>
          </div>
        </div>
      </header>

      {/* ── COUNTDOWN ── */}
      <div className="countdown-bar"><span>{countdown}</span></div>

      {/* ── HOME ── */}
      <main className="page">
        <div className="strip">
          <span className="strip-text">Казахстан · 15 июня 2026 · Кокшетау</span>
          <div className="strip-badge">🏆 WSC 2026</div>
        </div>
        <div className="stats-row">
          {[["42.195 км","ДИСТАНЦИЯ","#8b5cf6"],["5 000+","УЧАСТНИКОВ","#34d399"],["20+","СТРАН","#3b82f6"],["15 июня 2026","ДАТА СТАРТА","#f59e0b"]].map(([v,l,c])=>(
            <div className="stat-card" key={l} style={{"--accent":c}}>
              <div className="stat-value" style={{color:c}}>{v}</div>
              <div className="stat-label">{l}</div>
            </div>
          ))}
        </div>
        <div className="home-columns">
          <div className="photo-grid">
            <div className="photo-tile photo-top" style={{"--accent":"#8b5cf6"}}>
              <img src="https://images.unsplash.com/photo-1530549387789-4c1017266635?w=900&q=80" alt="Старт марафона"/>
              <div className="photo-caption">Старт марафона</div>
            </div>
            <div className="photo-tile" style={{"--accent":"#34d399"}}>
              <img src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&q=80" alt="Финиш"/>
              <div className="photo-caption">Финиш</div>
            </div>
            <div className="photo-tile" style={{"--accent":"#3b82f6"}}>
              <img src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80" alt="Команды"/>
              <div className="photo-caption">Команды</div>
            </div>
          </div>
          <div className="info-card">
            <div className="card-section-label">О МАРАФОНЕ</div>
            <h2 className="card-heading">Испытание воли<br/>и выносливости</h2>
            <div className="card-divider"></div>
            <p className="card-body">
              Марафон — это не просто забег на дистанцию <strong>42,195 км</strong>. Это ежегодный ритуал, который объединяет профессиональных атлетов, любителей и тысячи зрителей в едином порыве воли и выносливости.<br/><br/>
              Примерно на <strong>30–35 километре</strong> многие бегуны сталкиваются с явлением, которое называют <strong>«стеной»</strong>. Преодоление этого барьера — не вопрос физики, а вопрос чистого упрямства и силы духа.
            </p>
            <button className="btn btn-accent btn-lg" onClick={() => setModal("register")}>✚ Зарегистрироваться</button>
          </div>
        </div>
      </main>

      {/* ══ REGISTER MODAL ══ */}
      {modal === "register" && (
        <div className="modal-overlay open" onClick={(e) => e.target.className.includes("modal-overlay") && setModal(null)}>
          <div className="modal-window modal-register">
            <header className="modal-header">
              <div className="header-logo small">M</div>
              <span className="header-title">MARATHON SKILLS 2026</span>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>← Назад</button>
            </header>
            <div className="countdown-bar mini"><span>{countdown}</span></div>
            <div className="register-scroll">
              <div className="register-card">
                <div className="card-section-label">УЧАСТНИК МАРАФОНА</div>
                <h3 className="card-subhead">Регистрация бегуна</h3>
                <div className="card-divider"></div>
                <p className="form-hint">Заполните все поля для участия в марафоне</p>
                <div className="form-columns">
                  <div className="form-col">
                    {[["📧 Email:","email","email",""],["🔒 Пароль:","pass","password",""],["🔒 Повторите пароль:","pass2","password",""],["👤 Имя:","first","text",""],["👤 Фамилия:","last","text",""]].map(([lbl,key,type])=>(
                      <div className="form-row" key={key}>
                        <label>{lbl}</label>
                        <div className="input-wrap">
                          <input type={type} className="input" value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} />
                          {errs[key] && <span className="field-err">{errs[key]}</span>}
                        </div>
                      </div>
                    ))}
                    <div className="form-row">
                      <label>⚧ Пол:</label>
                      <div className="input-wrap">
                        <select className="input" value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
                          <option>Мужской</option><option>Женский</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <label>📅 Дата рождения:</label>
                      <div className="input-wrap">
                        <input type="date" className="input" value={form.birth} onChange={e=>setForm(f=>({...f,birth:e.target.value}))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <label>🌍 Страна:</label>
                      <div className="input-wrap">
                        <select className="input" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}>
                          {["Kazakhstan","Russia","Germany","France","USA","UK","Italy","Spain","Brazil","China","Japan","Kenya","Ethiopia","Ukraine","Belarus","Poland","Czech Republic","Sweden","Norway","Finland"].map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-btns">
                  <button className="btn btn-accent btn-lg" onClick={handleRegister} disabled={loading}>
                    {loading ? "Сохранение..." : "✚ Зарегистрироваться"}
                  </button>
                  <button className="btn btn-ghost btn-lg" onClick={() => setModal(null)}>✕ Отмена</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ BMI MODAL ══ */}
      {modal === "bmi" && (
        <div className="modal-overlay open" onClick={(e) => e.target.className.includes("modal-overlay") && setModal(null)}>
          <div className="modal-window modal-bmi">
            <header className="modal-header">
              <div className="header-logo small">M</div>
              <span className="header-title">BMI КАЛЬКУЛЯТОР</span>
              <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
                <button className="btn btn-accent" onClick={handleSaveBMI}>💾 Сохранить</button>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>← Назад</button>
              </div>
            </header>
            <div className="countdown-bar mini"><span>{countdown}</span></div>
            <div className="bmi-content">
              <div className="bmi-card">
                <div className="card-section-label">ИНДЕКС МАССЫ ТЕЛА</div>
                <h3 className="card-subhead">BMI Калькулятор</h3>
                <div className="card-divider"></div>
                <div className="bmi-layout">
                  <div className="bmi-left">
                    <div className="gender-label-row">ПОЛ</div>
                    <div className="gender-btns">
                      <button className={`gender-btn${bmiData.gender==="male"?" active-male":""}`} onClick={()=>setBmiData(b=>({...b,gender:"male"}))}>♂ Мужской</button>
                      <button className={`gender-btn${bmiData.gender==="female"?" active-female":""}`} onClick={()=>setBmiData(b=>({...b,gender:"female"}))}>♀ Женский</button>
                    </div>
                    {[["Рост:","height","см"],["Вес:","weight","кг"],["Возраст:","age","лет"]].map(([lbl,key,unit])=>(
                      <div className="bmi-row" key={key}>
                        <label>{lbl}</label>
                        <input type="number" className="input bmi-input" value={bmiData[key]} onChange={e=>setBmiData(b=>({...b,[key]:e.target.value}))} />
                        <span className="unit">{unit}</span>
                      </div>
                    ))}
                    <div className="bmi-btns">
                      <button className="btn btn-accent" onClick={()=>setBmiResult(calcBMI(bmiData.height,bmiData.weight))}>▶ Рассчитать</button>
                      <button className="btn btn-ghost" onClick={()=>setBmiResult(0)}>↺ Сброс</button>
                    </div>
                  </div>
                  <div className="bmi-right">
                    <div className="result-sec-label">РЕЗУЛЬТАТ</div>
                    <div className="result-figure">{bmiCat ? bmiCat.fig : "🏃"}</div>
                    <div className="result-value" style={{color:bmiCat?.col}}>{bmiResult > 0 ? bmiResult.toFixed(1) : "—"}</div>
                    <div className="result-category" style={{color:bmiCat?.col}}>{bmiCat ? bmiCat.cat : "Введите данные"}</div>
                    <BMIScale bmi={bmiResult} />
                    {bmiResult > 0 && <>
                      <div className="result-extra">⚖️ Идеальный вес: {Math.round(bmiIdealLow)}–{Math.round(bmiIdealLow+5)} кг</div>
                      <div className="result-extra">🔥 Оценка жира: {bmiFat.toFixed(1)}%</div>
                    </>}
                    {lastReg && <div className="result-user">👤 {lastReg.name} {lastReg.surname}</div>}
                    <div className="bmi-tips">
                      <div className="tip">💡 ИМТ не учитывает мышечную массу</div>
                      <div className="tip">💡 Для спортсменов BMI может быть выше нормы</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ USERS MODAL ══ */}
      {modal === "users" && (
        <div className="modal-overlay open" onClick={(e) => e.target.className.includes("modal-overlay") && setModal(null)}>
          <div className="modal-window modal-users">
            <header className="modal-header">
              <div className="header-logo small">M</div>
              <span className="header-title">MARATHON SKILLS 2026</span>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>← Назад</button>
            </header>
            <div className="users-strip">Зарегистрированные участники</div>
            <div className="filter-bar">
              <div className="filter-left">
                <label className="filter-lbl">Роль:</label>
                <select className="input filter-input" value={filter.role} onChange={e=>setFilter(f=>({...f,role:e.target.value}))}>
                  <option value="">Все роли</option>
                  <option value="Координатор">Координатор</option>
                  <option value="Бегун">Бегун</option>
                </select>
                <label className="filter-lbl">Сортировка:</label>
                <select className="input filter-input" value={filter.sort} onChange={e=>setFilter(f=>({...f,sort:e.target.value}))}>
                  <option value="first">Имени</option>
                  <option value="last">Фамилии</option>
                  <option value="email">Email</option>
                  <option value="role">Роли</option>
                </select>
              </div>
              <div className="filter-right">
                <span className="search-icon">🔍</span>
                <input type="text" className="input filter-input search-input" placeholder="Поиск..." value={filter.q} onChange={e=>setFilter(f=>({...f,q:e.target.value}))} />
                <button className="btn btn-accent" onClick={loadParticipants}>Обновить</button>
              </div>
            </div>
            <div className="users-count">
              Всего: {filtered.length} | 🏃 Бегунов: {filtered.filter(u=>u.role==="Бегун").length} | 📋 Координаторов: {filtered.filter(u=>u.role==="Координатор").length}
            </div>
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr><th>ИМЯ</th><th>ФАМИЛИЯ</th><th>EMAIL</th><th>BMI</th><th>РОЛЬ</th></tr>
                </thead>
                <tbody>
                  {filtered.map(u=>(
                    <tr key={u.id}>
                      <td style={{color:"var(--text)"}}>{u.name}</td>
                      <td>{u.surname}</td>
                      <td style={{color:"var(--dim)"}}>{u.email}</td>
                      <td>{u.bmi ? parseFloat(u.bmi).toFixed(1) : "—"}</td>
                      <td><span className={`role-badge ${u.role==="Координатор"?"role-coord":"role-runner"}`}>{u.role}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="countdown-bar mini"><span>{countdown}</span></div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Защищённый маршрут на уровне SSR ──────────────────────────────────────────
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { session } };
}
