import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const EASTER_EMOJIS = ['🐣', '🐰', '🌸', '🌷', '🥚', '🐇', '🌼', '🦋']
const pastel = { bg: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 30%, #e8f5e9 60%, #fff9c4 100%)', card: '#ffffffcc', border: '#f8bbd0', button: '#ce93d8', danger: '#ef9a9a', text: '#5d4037', soft: '#8d6e63', header: '#ad1457' }

export default function App() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [dish, setDish] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchItems()
    const channel = supabase.channel('potluck_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'potluck_items' }, () => { fetchItems() }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchItems() {
    const { data, error } = await supabase.from('potluck_items').select('*').order('created_at', { ascending: true })
    if (!error) setItems(data || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim() || !dish.trim()) { setError('Please enter both your name and a dish!'); return }
    setAdding(true); setError('')
    const { error } = await supabase.from('potluck_items').insert([{ name: name.trim(), dish: dish.trim() }])
    if (error) { setError('Something went wrong. Please try again.') } else { setName(''); setDish('') }
    setAdding(false)
  }

  async function handleDelete(id) {
    await supabase.from('potluck_items').delete().eq('id', id)
    setConfirmDelete(null)
  }

  const emoji = (i) => EASTER_EMOJIS[i % EASTER_EMOJIS.length]

  return (
    <div style={{ minHeight: '100vh', background: pastel.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '24px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🐣🌷🐰</div>
          <h1 style={{ color: pastel.header, fontSize: 28, fontWeight: 700, margin: 0 }}>Easter Potluck Sign-Up</h1>
          <p style={{ color: pastel.soft, marginTop: 6, fontSize: 15 }}>Add your name and what you are bringing — everyone sees the same list!</p>
        </div>
        <div style={{ background: pastel.card, borderRadius: 16, border: '2px solid #f8bbd0', padding: 24, marginBottom: 24, boxShadow: '0 4px 16px #f8bbd040' }}>
          <h2 style={{ color: pastel.text, fontSize: 17, marginTop: 0, marginBottom: 16 }}>🌸 I will bring...</h2>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #f8bbd0', fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fff9fb' }} />
              <input placeholder="What dish are you bringing?" value={dish} onChange={e => setDish(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #f8bbd0', fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fff9fb' }} />
              {error && <p style={{ color: '#c62828', margin: 0, fontSize: 13 }}>{error}</p>}
              <button type="submit" disabled={adding} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 600, fontSize: 15, cursor: adding ? 'not-allowed' : 'pointer', background: pastel.button, opacity: adding ? 0.7 : 1 }}>
                {adding ? 'Adding...' : '🥚 Add to List'}
              </button>
            </div>
          </form>
        </div>
        <div style={{ background: pastel.card, borderRadius: 16, border: '2px solid #f8bbd0', padding: 24, boxShadow: '0 4px 16px #f8bbd040' }}>
          <h2 style={{ color: pastel.text, fontSize: 17, marginTop: 0, marginBottom: 16 }}>🐇 Who is bringing what ({items.length})</h2>
          {loading && <p style={{ color: pastel.soft, textAlign: 'center' }}>Loading... 🌷</p>}
          {!loading && items.length === 0 && <p style={{ color: pastel.soft, textAlign: 'center', fontStyle: 'italic' }}>No one has signed up yet — be the first! 🌼</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 12, border: '1.5px solid #f8bbd0', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{emoji(i)}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: pastel.text, fontSize: 15 }}>{item.name}</div>
                    <div style={{ color: pastel.soft, fontSize: 13 }}>{item.dish}</div>
                  </div>
                </div>
                {confirmDelete === item.id ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleDelete(item.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', background: '#ef9a9a' }}>Yes, remove</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', background: '#bdbdbd' }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(item.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 13, cursor: 'pointer', background: '#eeeeee', color: pastel.soft }}>x Unclaim</button>
                )}
              </div>
            ))}
          </div>
        </div>
        <p style={{ textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 24 }}>Happy Easter! 🌷 Share this link with your friends.</p>
      </div>
    </div>
  )
}
