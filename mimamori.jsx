import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leafletデフォルトアイコン修正
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ========== 定数 ==========
const SCHOOL_CENTER = [38.2295, 140.8420]; // 八木山中学校周辺

const INITIAL_SPOTS = [
  { id: "s1", name: "八木山中学校 正門前", lat: 38.2295, lng: 140.8420, address: "仙台市太白区八木山本町" },
  { id: "s2", name: "八木山動物公園前 交差点", lat: 38.2310, lng: 140.8380, address: "仙台市太白区八木山南" },
  { id: "s3", name: "八木山橋 北側", lat: 38.2340, lng: 140.8450, address: "仙台市太白区八木山" },
  { id: "s4", name: "南光台通り 交差点", lat: 38.2270, lng: 140.8460, address: "仙台市太白区八木山本町" },
  { id: "s5", name: "八木山小学校 前", lat: 38.2280, lng: 140.8395, address: "仙台市太白区八木山本町" },
];

const USERS = [
  { id: "u1", role: "admin", name: "管理者", nickname: "管理者" },
  { id: "u2", role: "member", name: "山田 花子", nickname: "ハナコ" },
  { id: "u3", role: "member", name: "佐藤 次郎", nickname: "じろう" },
  { id: "u4", role: "member", name: "田中 美咲", nickname: "みさき" },
];

// ========== カスタムマーカーアイコン ==========
function createSpotIcon(hasRegistration) {
  const color = hasRegistration ? "#2563eb" : "#dc2626";
  const shadow = hasRegistration ? "rgba(37,99,235,0.4)" : "rgba(220,38,38,0.4)";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:36px;height:36px">
        <div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);box-shadow:0 4px 14px ${shadow};border:3px solid white"></div>
        <div style="position:absolute;top:7px;left:7px;width:18px;height:18px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;font-size:11px">
          ${hasRegistration ? "👤" : "❗"}
        </div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// ========== 日付ユーティリティ ==========
function getDefaultDate() {
  const now = new Date();
  if (now.getHours() >= 9) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }
  return now.toISOString().split("T")[0];
}

function formatDateJP(dateStr) {
  const d = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

function getDateRange() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 92; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// ========== ログイン画面 ==========
function LoginScreen({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0c1a2e 0%,#1a3a5c 60%,#0f4c75 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Hiragino Kaku Gothic ProN, YuGothic, sans-serif", padding: 20 }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .user-card:hover { transform:translateY(-2px) !important; border-color:#38bdf8 !important; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp 0.6s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 64, animation: "float 3s ease-in-out infinite", display: "inline-block", filter: "drop-shadow(0 8px 24px rgba(56,189,248,0.5))" }}>👁️</div>
          <h1 style={{ margin: "12px 0 4px", fontSize: 26, fontWeight: 900, color: "white", letterSpacing: 2 }}>見守りナビ</h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>八木山中学校 登校見守り活動</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, padding: "28px 24px" }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1 }}>アカウントを選択</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {USERS.map(u => (
              <div key={u.id} className="user-card"
                onClick={() => setSelectedUser(u)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: `2px solid ${selectedUser?.id === u.id ? "#38bdf8" : "rgba(255,255,255,0.1)"}`, background: selectedUser?.id === u.id ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)", cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: u.role === "admin" ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#38bdf8,#0284c7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {u.role === "admin" ? "👑" : "👤"}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "white", fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{u.role === "admin" ? "管理者" : `ニックネーム：${u.nickname}`}</div>
                </div>
                {selectedUser?.id === u.id && <div style={{ marginLeft: "auto", color: "#38bdf8", fontWeight: 700 }}>✓</div>}
              </div>
            ))}
          </div>

          <button onClick={() => selectedUser && onLogin(selectedUser)} disabled={!selectedUser}
            style={{ width: "100%", marginTop: 20, padding: "14px", borderRadius: 14, border: "none", background: selectedUser ? "linear-gradient(135deg,#0284c7,#0369a1)" : "rgba(255,255,255,0.1)", color: "white", fontWeight: 800, fontSize: 15, cursor: selectedUser ? "pointer" : "not-allowed", fontFamily: "inherit", boxShadow: selectedUser ? "0 4px 20px rgba(2,132,199,0.4)" : "none", transition: "all 0.2s" }}>
            ログイン →
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== マップビュー ==========
function MapView({ spots, registrations, selectedDate, currentUser, onRegister, onCancel }) {
  return (
    <div style={{ flex: 1, position: "relative" }}>
      <MapContainer center={SCHOOL_CENTER} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {spots.map(spot => {
          const dayRegs = registrations.filter(r => r.spotId === spot.id && r.date === selectedDate);
          const hasReg = dayRegs.length > 0;
          const myReg = dayRegs.find(r => r.userId === currentUser.id);

          return (
            <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={createSpotIcon(hasReg)}>
              <Popup>
                <div style={{ minWidth: 200, fontFamily: "Hiragino Kaku Gothic ProN, YuGothic, sans-serif" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0c1a2e", marginBottom: 6 }}>📍 {spot.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{spot.address}</div>
                  <div style={{ fontSize: 12, marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, color: "#475569" }}>登録者：</span>
                    {hasReg
                      ? <span style={{ color: "#2563eb", fontWeight: 700 }}>{dayRegs.map(r => r.nickname).join("、")}</span>
                      : <span style={{ color: "#dc2626" }}>未登録</span>
                    }
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>🕗 朝の登校時間帯</div>

                  {currentUser.role === "member" && (
                    myReg
                      ? <button onClick={() => onCancel(myReg.id)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "2px solid #fecaca", background: "white", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>🗑 キャンセル</button>
                      : <button onClick={() => onRegister(spot)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#0284c7,#0369a1)", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✋ この日に参加する</button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* 凡例 */}
      <div style={{ position: "absolute", bottom: 24, left: 16, background: "white", borderRadius: 12, padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 1000, fontSize: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#2563eb" }} />
          <span style={{ color: "#334155", fontWeight: 600 }}>見守り登録あり</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#dc2626" }} />
          <span style={{ color: "#334155", fontWeight: 600 }}>未登録（サポート必要）</span>
        </div>
      </div>
    </div>
  );
}

// ========== カレンダービュー ==========
function CalendarView({ spots, registrations, currentUser, onRegister, onCancel }) {
  const [selectedSpot, setSelectedSpot] = useState(spots[0]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 92);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay = getFirstDay(currentMonth.year, currentMonth.month);

  const canPrevMonth = () => {
    const prev = new Date(currentMonth.year, currentMonth.month - 1, 1);
    return prev >= new Date(today.getFullYear(), today.getMonth(), 1);
  };
  const canNextMonth = () => {
    const next = new Date(currentMonth.year, currentMonth.month + 1, 1);
    return next <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "16px", background: "#f8fafc" }}>
      {/* スポット選択 */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {spots.map(spot => (
          <button key={spot.id} onClick={() => setSelectedSpot(spot)}
            style={{ padding: "7px 14px", borderRadius: 20, border: "2px solid", borderColor: selectedSpot?.id === spot.id ? "#0284c7" : "#e2e8f0", background: selectedSpot?.id === spot.id ? "#e0f2fe" : "white", color: selectedSpot?.id === spot.id ? "#0284c7" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: selectedSpot?.id === spot.id ? 700 : 500, transition: "all 0.2s" }}>
            📍 {spot.name}
          </button>
        ))}
      </div>

      {/* カレンダー */}
      <div style={{ background: "white", borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "linear-gradient(135deg,#0284c7,#0369a1)", color: "white" }}>
          <button onClick={() => canPrevMonth() && setCurrentMonth(p => ({ year: p.month === 0 ? p.year - 1 : p.year, month: p.month === 0 ? 11 : p.month - 1 }))} disabled={!canPrevMonth()} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 32, height: 32, color: "white", cursor: canPrevMonth() ? "pointer" : "not-allowed", fontSize: 16, opacity: canPrevMonth() ? 1 : 0.3 }}>‹</button>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{currentMonth.year}年{currentMonth.month + 1}月</div>
          <button onClick={() => canNextMonth() && setCurrentMonth(p => ({ year: p.month === 11 ? p.year + 1 : p.year, month: p.month === 11 ? 0 : p.month + 1 }))} disabled={!canNextMonth()} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 32, height: 32, color: "white", cursor: canNextMonth() ? "pointer" : "not-allowed", fontSize: 16, opacity: canNextMonth() ? 1 : 0.3 }}>›</button>
        </div>

        {/* 曜日ヘッダー */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#f1f5f9" }}>
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div key={d} style={{ textAlign: "center", padding: "8px 0", fontSize: 12, fontWeight: 700, color: i === 0 ? "#dc2626" : i === 6 ? "#2563eb" : "#64748b" }}>{d}</div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, background: "#e2e8f0" }}>
          {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} style={{ background: "#f8fafc", minHeight: 70 }} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const cellDate = new Date(currentMonth.year, currentMonth.month, day);
            const isToday = cellDate.toDateString() === today.toDateString();
            const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isFuture = cellDate > maxDate;
            const isDisabled = isPast || isFuture;

            const dayRegs = registrations.filter(r => r.spotId === selectedSpot?.id && r.date === dateStr);
            const myReg = dayRegs.find(r => r.userId === currentUser.id);
            const dow = cellDate.getDay();

            return (
              <div key={day} style={{ background: "white", minHeight: 70, padding: "6px", opacity: isDisabled ? 0.4 : 1 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isToday ? "#0284c7" : "transparent", color: isToday ? "white" : dow === 0 ? "#dc2626" : dow === 6 ? "#2563eb" : "#334155", fontWeight: isToday ? 700 : 500, fontSize: 13, marginBottom: 4 }}>{day}</div>
                {dayRegs.map(r => (
                  <div key={r.id} style={{ fontSize: 10, padding: "2px 5px", borderRadius: 4, background: r.userId === currentUser.id ? "#dbeafe" : "#f0fdf4", color: r.userId === currentUser.id ? "#1d4ed8" : "#16a34a", fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.nickname}
                  </div>
                ))}
                {!isDisabled && currentUser.role === "member" && (
                  myReg
                    ? <button onClick={() => onCancel(myReg.id)} style={{ width: "100%", fontSize: 9, padding: "2px", borderRadius: 4, border: "1px solid #fecaca", background: "white", color: "#dc2626", cursor: "pointer", marginTop: 2 }}>取消</button>
                    : <button onClick={() => onRegister(selectedSpot, dateStr)} style={{ width: "100%", fontSize: 9, padding: "2px", borderRadius: 4, border: "none", background: "#e0f2fe", color: "#0284c7", cursor: "pointer", marginTop: 2 }}>参加</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ========== 管理：スポット管理 ==========
function SpotManager({ spots, onAdd, onDelete }) {
  const [form, setForm] = useState({ name: "", address: "", lat: "", lng: "" });
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!form.name || !form.lat || !form.lng) { alert("スポット名・緯度・経度は必須です"); return; }
    onAdd({ id: `s${Date.now()}`, name: form.name, address: form.address, lat: parseFloat(form.lat), lng: parseFloat(form.lng) });
    setForm({ name: "", address: "", lat: "", lng: "" });
    setAdding(false);
  };

  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "2px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", color: "#1e293b", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16, background: "#f8fafc" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0c1a2e" }}>📍 見守りスポット管理</h3>
          <button onClick={() => setAdding(!adding)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0284c7,#0369a1)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>＋ 新規追加</button>
        </div>

        {adding && (
          <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#0284c7" }}>新しいスポットを追加</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="スポット名 *" style={inputStyle} />
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="住所・目印" style={inputStyle} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input value={form.lat} onChange={e => setForm(p => ({ ...p, lat: e.target.value }))} placeholder="緯度（例: 38.2295）*" style={inputStyle} />
                <input value={form.lng} onChange={e => setForm(p => ({ ...p, lng: e.target.value }))} placeholder="経度（例: 140.8420）*" style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setAdding(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "2px solid #e2e8f0", background: "white", color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>キャンセル</button>
                <button onClick={handleAdd} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0284c7,#0369a1)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>追加する</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {spots.map(spot => (
            <div key={spot.id} style={{ background: "white", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#0284c7,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📍</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0c1a2e" }}>{spot.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{spot.address} / {spot.lat}, {spot.lng}</div>
              </div>
              <button onClick={() => onDelete(spot.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "white", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>削除</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== メインアプリ ==========
export default function MimamoriApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("map"); // "map" | "calendar" | "spots"
  const [selectedDate, setSelectedDate] = useState(getDefaultDate);
  const [spots, setSpots] = useState(INITIAL_SPOTS);
  const [registrations, setRegistrations] = useState([
    { id: "r1", spotId: "s1", userId: "u2", nickname: "ハナコ", date: getDefaultDate() },
    { id: "r2", spotId: "s3", userId: "u3", nickname: "じろう", date: getDefaultDate() },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRange = getDateRange();

  const handleRegister = (spot, date) => {
    const targetDate = date || selectedDate;
    const already = registrations.find(r => r.spotId === spot.id && r.userId === currentUser.id && r.date === targetDate);
    if (already) { alert("すでに登録済みです"); return; }
    const newReg = { id: `r${Date.now()}`, spotId: spot.id, userId: currentUser.id, nickname: currentUser.nickname, date: targetDate };
    setRegistrations(prev => [...prev, newReg]);
    alert(`✅ ${spot.name}\n${formatDateJP(targetDate)}\n見守り活動に登録しました！`);
  };

  const handleCancel = (regId) => {
    if (!window.confirm("登録をキャンセルしますか？")) return;
    setRegistrations(prev => prev.filter(r => r.id !== regId));
  };

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const tabs = [
    { id: "map", label: "🗺️ マップ" },
    { id: "calendar", label: "📅 カレンダー" },
    ...(currentUser.role === "admin" ? [{ id: "spots", label: "📍 スポット管理" }] : []),
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "Hiragino Kaku Gothic ProN, YuGothic, sans-serif", background: "#f8fafc" }}>
      <style>{`
        .tab-btn:hover { opacity: 0.8; }
        .date-chip:hover { background: #e0f2fe !important; border-color: #0284c7 !important; }
        * { box-sizing: border-box; }
      `}</style>

      {/* ヘッダー */}
      <header style={{ background: "linear-gradient(135deg,#0c1a2e,#1a3a5c)", padding: "0 16px", flexShrink: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 56 }}>
          <span style={{ fontSize: 22 }}>👁️</span>
          <span style={{ fontWeight: 900, fontSize: 16, color: "white", letterSpacing: 1 }}>見守りナビ</span>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 8 }}>
            {currentUser.role === "admin" ? "👑" : "👤"} {currentUser.nickname}
          </div>
          <button onClick={() => setCurrentUser(null)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>🏠 ホーム</button>
        </div>

        {/* タブ */}
        <div style={{ display: "flex", gap: 4, paddingBottom: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} className="tab-btn"
              style={{ padding: "8px 16px", border: "none", background: "transparent", color: view === tab.id ? "white" : "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13, fontWeight: view === tab.id ? 700 : 500, borderBottom: view === tab.id ? "2px solid #38bdf8" : "2px solid transparent", transition: "all 0.2s", fontFamily: "inherit" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 日付バー（マップビュー時のみ） */}
      {view === "map" && (
        <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "10px 16px", overflowX: "auto", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
            {dateRange.slice(0, 14).map(date => {
              const d = new Date(date);
              const days = ["日", "月", "火", "水", "木", "金", "土"];
              const isSelected = date === selectedDate;
              const isToday = date === new Date().toISOString().split("T")[0];
              return (
                <button key={date} onClick={() => setSelectedDate(date)} className="date-chip"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 12px", borderRadius: 12, border: `2px solid ${isSelected ? "#0284c7" : "#e2e8f0"}`, background: isSelected ? "#e0f2fe" : "white", cursor: "pointer", transition: "all 0.2s", minWidth: 52 }}>
                  <span style={{ fontSize: 10, color: isSelected ? "#0284c7" : "#94a3b8", fontWeight: 600 }}>{days[d.getDay()]}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: isSelected ? "#0284c7" : "#334155" }}>{d.getDate()}</span>
                  {isToday && <span style={{ fontSize: 9, color: "#0284c7", fontWeight: 700 }}>今日</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      {view === "map" && (
        <MapView spots={spots} registrations={registrations} selectedDate={selectedDate} currentUser={currentUser} onRegister={handleRegister} onCancel={handleCancel} />
      )}
      {view === "calendar" && (
        <CalendarView spots={spots} registrations={registrations} currentUser={currentUser} onRegister={handleRegister} onCancel={handleCancel} />
      )}
      {view === "spots" && currentUser.role === "admin" && (
        <SpotManager spots={spots} onAdd={spot => setSpots(prev => [...prev, spot])} onDelete={id => setSpots(prev => prev.filter(s => s.id !== id))} />
      )}
    </div>
  );
}
