import { useState, useEffect } from 'react'
import { ListFilter, Plus, Trash2, RefreshCw } from 'lucide-react'
import { FeaturePage } from '../Common/FeaturePage'

export default function BlocklistManager() {
  const [blocklists, setBlocklists] = useState([])
  const [selectedBl, setSelectedBl] = useState(null)
  const [items, setItems] = useState([])
  const [newTerm, setNewTerm] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => {
    loadBlocklists()
  }, [])

  const loadBlocklists = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/content-safety/blocklists')
      const data = await res.json()
      setBlocklists(data)
      if (data.length > 0 && !selectedBl) {
        setSelectedBl(data[0].name)
        loadItems(data[0].name)
      }
    } catch (e) {} finally { setLoading(false) }
  }

  const loadItems = async (name) => {
    setLoadingItems(true)
    try {
      const res = await fetch(`/api/content-safety/blocklists/${name}/items`)
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) {} finally { setLoadingItems(false) }
  }

  const handleSelectBl = (name) => {
    setSelectedBl(name)
    loadItems(name)
  }

  const handleAddTerm = async () => {
    if (!newTerm.trim()) return
    try {
      const res = await fetch('/api/content-safety/blocklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocklist_name: selectedBl,
          items: [...items, { text: newTerm, description: newDesc }],
        }),
      })
      await res.json()
      setItems(prev => [...prev, { text: newTerm, description: newDesc }])
      setNewTerm('')
      setNewDesc('')
    } catch (e) {}
  }

  const BL_COLORS = { 'financial-prohibited-terms': '#ef4444', 'restricted-securities': '#f97316', 'sanctions-list': '#8b5cf6' }
  const BL_ICONS = { 'financial-prohibited-terms': 'Prohibited Terms', 'restricted-securities': 'Restricted Securities', 'sanctions-list': 'Sanctions' }

  return (
    <FeaturePage
      title="Blocklist Manager"
      description="Manage custom blocklists for financial compliance enforcement. Three pre-configured lists cover prohibited trading language, restricted and sanctioned securities, and OFAC/international sanctions entities. Integrated with text analysis for real-time screening."
      icon={ListFilter}
      color="#ef4444"
    >
      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Blocklists</h3>
              <button className="btn-secondary" onClick={loadBlocklists} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                <RefreshCw size={12} />
              </button>
            </div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}><span className="spinner" /></div>
            ) : (
              blocklists.map(bl => {
                const color = BL_COLORS[bl.name] || '#3b82f6'
                return (
                  <div
                    key={bl.name}
                    onClick={() => handleSelectBl(bl.name)}
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.4rem',
                      background: selectedBl === bl.name ? `${color}12` : 'var(--bg-elevated)',
                      border: `1px solid ${selectedBl === bl.name ? color + '50' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: selectedBl === bl.name ? color : 'var(--text-primary)' }}>
                          {BL_ICONS[bl.name] || bl.name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>{bl.name}</div>
                      </div>
                      <span style={{
                        background: `${color}20`, color: color,
                        padding: '0.15rem 0.5rem', borderRadius: 20,
                        fontSize: '0.7rem', fontWeight: 700,
                      }}>{bl.item_count} items</span>
                    </div>
                    {bl.description && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{bl.description}</div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Add term form */}
          {selectedBl && (
            <div className="card">
              <div className="card-header">
                <h3>Add Term</h3>
              </div>
              <input value={newTerm} onChange={e => setNewTerm(e.target.value)} placeholder="Term to block (e.g. pump and dump)" style={{ marginBottom: '0.5rem' }} />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" style={{ marginBottom: '0.75rem' }} />
              <button className="btn-danger" onClick={handleAddTerm} disabled={!newTerm.trim()}>
                <Plus size={14} /> Add to Blocklist
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>{selectedBl ? BL_ICONS[selectedBl] || selectedBl : 'Select a blocklist'}</h3>
            {items.length > 0 && <span className="badge badge-blue">{items.length} items</span>}
          </div>
          {loadingItems ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><span className="spinner" /></div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No items found</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Term</th><th>Description</th></tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="primary mono">{item.text}</td>
                    <td>{item.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </FeaturePage>
  )
}
