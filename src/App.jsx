import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const CATEGORIES = [
  { id: 'eggs', label: '🍳 Egg Dishes', examples: 'quiche, frittata, deviled eggs...' },
  { id: 'mains', label: '🥓 Mains', examples: 'ham, bacon, smoked salmon...' },
  { id: 'pastries', label: '🥐 Pastries & Breads', examples: 'muffins, croissants, coffee cake...' },
  { id: 'fruit', label: '🥗 Fruit & Salads', examples: 'fruit salad, green salad, yogurt parfait...' },
  { id: 'desserts', label: '🍰 Desserts', examples: 'carrot cake, cookies, brownies...' },
  { id: 'drinks', label: '🥂 Drinks', examples: 'mimosas, juice, coffee - mostly covered!' },
]

const pastel = {
  bg: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 30%, #e8f5e9 60%, #fff9c4 100%)',
  card: '#ffffffcc', border: '#f8bbd0', button: '#ce93d8', danger: '#ef9a9a',
  text: '#5d4037', soft: '#8d6e63', header: '#ad1457',
  banner: '#fff0f6', bannerBorder: '#f48fb1', edit: '#80cbc4',
}

export default function App() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [dish, setDish] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [takenWarning, setTakenWarning] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDish, setEditDish] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchItems()
    const channel = supabase.channel('potluck_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'potluck_items' }, () => fetchItems())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchItems() {
    const { data, error } = await supabase.from('potluck_items').select('*').order('created_at', { ascending: true })
    if (!error) setItems(data || [])
    setLoading(false)
  }

  function checkIfTaken(dishName) {
    if (!dishName.trim()) { setTakenWarning(''); return }
    const lower = dishName.toLowerCase().trim()
    const match = items.find(i => i.dish.toLowerCase().includes(lower) || lower.includes(i.dish.toLowerCase()))
    if (match) {
      setTakenWarning('Heads up - ' + match.name + ' is already bringing "' + match.dish + '"! Consider something different or coordinate with them.')
    } else { setTakenWarning('') }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim() || !dish.trim()) { setError('Please enter both your name and a dish!'); return }
    if (!category) { setError('Please select a category!'); return }
    setAdding(true); setError('')
    const { error } = await supabase.from('potluck_items').insert([{ name: name.trim(), dish: dish.trim(), category }])
    if (error) { setError('Something went wrong. Please try again.') }
    else { setName(''); setDish(''); setCategory(''); setTakenWarning('') }
    setAdding(false)
  }

  async function handleDelete(id) {
    await supabase.from('potluck_items').delete().eq('id', id)
    setConfirmDelete(null)
  }

  function startEdit(item) {
    setEditId(item.id); setEditName(item.name); setEditDish(item.dish); setEditCategory(item.category || '')
  }

  async function handleSaveEdit(id) {
    if (!editName.trim() || !editDish.trim()) return
    setSaving(true)
    await supabase.from('potluck_items').update({ name: editName.trim(), dish: editDish.trim(), category: editCategory }).eq('id', id)
    setEditId(null); setSaving(false)
  }

  const grouped = CATEGORIES.map(cat => ({ ...cat, items: items.filter(i => i.category === cat.id) }))
  const uncategorized = items.filter(i => !i.category)

  function renderItem(item) {
    if (editId === item.id) {
      return (
        <div key={item.id} style={{ background: '#f3e5f5', borderRadius: 12, border: '1.5px solid #80cbc4', padding: '12px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inputStyle, fontSize: 14 }} placeholder="Name" />
            <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ ...inputStyle, fontSize: 14 }}>
              <option value="">No category</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input value={editDish} onChange={e => setEditDish(e.target.value)} style={{ ...inputStyle, fontSize: 14 }} placeholder="Dish" />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleSaveEdit(item.id)} disabled={saving} style={{ ...smallBtn, background: '#80cbc4', color: '#fff', flex: 1 }}>{saving ? 'Saving...' : 'Save'}</button>
              <button onClick={() => setEditId(null)} style={{ ...smallBtn, background: '#bdbdbd', color: '#fff' }}>Cancel</button>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 12, border: '1.5px solid #f8bbd0', padding: '10px 14px' }}>
        <div>
          <div style={{ fontWeight: 600, color: pastel.text, fontSize: 14 }}>{item.name}</div>
          <div style={{ color: pastel.soft, fontSize: 13 }}>{item.dish}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {confirmDelete === item.id ? (
            <>
              <button onClick={() => handleDelete(item.id)} style={{ ...smallBtn, background: '#ef9a9a', color: '#fff' }}>Yes, remove</button>
              <button onClick={() => setConfirmDelete(null)} style={{ ...smallBtn, background: '#bdbdbd', color: '#fff' }}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => startEdit(item)} style={{ ...smallBtn, background: '#e0f2f1', color: '#00695c' }}>Edit</button>
              <button onClick={() => setConfirmDelete(item.id)} style={{ ...smallBtn, background: '#eeeeee', color: '#8d6e63' }}>x</button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: pastel.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '24px 16px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 6 }}>🐣🌷🐰</div>
          <h1 style={{ color: pastel.header, fontSize: 26, fontWeight: 700, margin: 0 }}>Easter Potluck Sign-Up</h1>
        </div>
        <div style={{ background: pastel.banner, border: '2px solid #f48fb1', borderRadius: 16, padding: '16px 20px', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: pastel.header, marginBottom: 4 }}>🌸 Easter Sunday Brunch</div>
          <div style={{ color: pastel.text, fontSize: 15, marginBottom: 2 }}>Sunday, April 5, 2026 · 11:00 AM</div>
          <div style={{ color: pastel.soft, fontSize: 14, marginTop: 6 }}>Sign up below with your name and what you are bringing. Everyone sees the same list in real time!</div>
        </div>
        <div style={{ background: pastel.card, borderRadius: 16, border: '2px solid #f8bbd0', padding: 24, marginBottom: 24, boxShadow: '0 4px 16px #f8bbd040' }}>
          <h2 style={{ color: pastel.text, fontSize: 17, marginTop: 0, marginBottom: 16 }}>🌸 I will bring...</h2>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, color: category ? pastel.text : '#aaa' }}>
                <option value="" disabled>Select a category...</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              {category && <div style={{ fontSize: 12, color: pastel.soft, marginTop: -6, paddingLeft: 4 }}>e.g. {CATEGORIES.find(c => c.id === category)?.examples}</div>}
              <input placeholder="What dish are you bringing?" value={dish} onChange={e => { setDish(e.target.value); checkIfTaken(e.target.value) }} style={inputStyle} />
              {takenWarning && <div style={{ background: '#fff9c4', border: '1.5px solid #f9a825', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#5d4037' }}>warning: {takenWarning}</div>}
              {error && <p style={{ color: '#c62828', margin: 0, fontSize: 13 }}>{error}</p>}
              <button type="submit" disabled={adding} style={{ ...btnStyle, background: pastel.button, opacity: adding ? 0.7 : 1, cursor: adding ? 'not-allowed' : 'pointer' }}>
                {adding ? 'Adding...' : 'Add to List'}
              </button>
            </div>
          </form>
        </div>
        <div style={{ background: pastel.card, borderRadius: 16, border: '2px solid #f8bbd0', padding: 24, boxShadow: '0 4px 16px #f8bbd040' }}>
          <h2 style={{ color: pastel.text, fontSize: 17, marginTop: 0, marginBottom: 20 }}>Who is bringing what ({items.length})</h2>
          {loading && <p style={{ color: pastel.soft, textAlign: 'center' }}>Loading...</p>}
          {!loading && items.length === 0 && <p style={{ color: pastel.soft, textAlign: 'center', fontStyle: 'italic' }}>No one has signed up yet - be the first!</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {grouped.map(cat => cat.items.length === 0 ? null : (
              <div key={cat.id}>
                <div style={{ fontWeight: 700, color: pastel.header, fontSize: 14, marginBottom: 8, paddingBottom: 4, borderBottom: '1.5px solid #f8bbd0' }}>{cat.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{cat.items.map(item => renderItem(item))}</div>
              </div>
            ))}
            {uncategorized.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, color: pastel.soft, fontSize: 14, marginBottom: 8 }}>Other</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{uncategorized.map(item => renderItem(item))}</div>
              </div>
            )}
          </div>
        </div>
        <p style={{ textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 24 }}>Happy Easter! Share this link with your friends.</p>
      </div>
    </div>
  )
}

const inputStyle = { padding: '10px 14px', borderRadius: 10, border: '1.5px solid #f8bbd0', fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fff9fb' }
const btnStyle = { padding: '11px 20px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' }
const smallBtn = { padding: '6px 10px', borderRadius: 8, border: 'none', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }
