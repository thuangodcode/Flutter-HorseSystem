import { useEffect, useState } from 'react'
import type { Invite } from '../types'
import { getInvites, acceptInvite, rejectInvite } from '@/api'

export function InvitesPage() {
  const [items, setItems] = useState<Invite[] | null>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  useEffect(() => { loadInvites() }, [])

  function loadInvites() {
    setItems(null)
    getInvites().then(setItems).catch(() => setItems([]))
  }

  async function handleAccept(id: string) {
    setLoading((prev) => ({ ...prev, [id]: true }))
    try { await acceptInvite(id); loadInvites() }
    catch { alert('Failed to accept invitation') }
    finally { setLoading((prev) => ({ ...prev, [id]: false })) }
  }

  async function handleReject(id: string) {
    setLoading((prev) => ({ ...prev, [id]: true }))
    try { await rejectInvite(id); loadInvites() }
    catch { alert('Failed to reject invitation') }
    finally { setLoading((prev) => ({ ...prev, [id]: false })) }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Invites (Jockey)</h2>
      <p className="muted">Nhận lời mời điều khiển ngựa, xác nhận/từ chối.</p>

      {!items ? <p className="muted">Loading…</p> : null}
      {items && items.length === 0 ? <p className="muted">Không có lời mời nào.</p> : null}
      {items && items.length > 0 ? (
        <ul>
          {items.map((i) => (
            <li key={i.id} style={{ marginBottom: 8 }}>
              <strong>{i.horseName || 'Ngựa thi đấu'}</strong>
              {' '}<span className="muted">({i.status})</span>
              {i.message ? <span className="muted" style={{ display: 'block', fontSize: '0.85em' }}>"{i.message}"</span> : null}
              {i.status === 'PENDING' ? (
                <span style={{ marginLeft: 8 }}>
                  <button className="btn btn-sm" style={{ marginRight: 4 }} disabled={loading[i.id]} onClick={() => handleAccept(i.id)}>
                    {loading[i.id] ? '...' : 'Accept'}
                  </button>
                  <button className="btn btn-sm" disabled={loading[i.id]} onClick={() => handleReject(i.id)}>
                    {loading[i.id] ? '...' : 'Reject'}
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
