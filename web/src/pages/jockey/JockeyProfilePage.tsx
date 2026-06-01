import { useEffect, useState } from 'react'
import { getJockeyProfile, updateJockeyProfile } from '@/api'

export function JockeyProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ age: '', experience: '', bio: '', specialties: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadProfile() }, [])

  function loadProfile() {
    getJockeyProfile().then((data) => {
      setProfile(data)
      setForm({ age: data.age?.toString() || '', experience: data.experience?.toString() || '', bio: data.bio || '', specialties: (data.specialties || []).join(', ') })
    }).catch(() => setError('Failed to load profile'))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateJockeyProfile({
        age: form.age ? parseInt(form.age) : undefined,
        experience: form.experience ? parseInt(form.experience) : undefined,
        bio: form.bio || undefined,
        specialties: form.specialties ? form.specialties.split(',').map((s) => s.trim()) : undefined,
      })
      setEditing(false); loadProfile()
    } catch { alert('Failed to update profile') }
    finally { setSaving(false) }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Jockey Profile</h2>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!profile && !error ? <p className="muted">Loading…</p> : null}
      {profile && !editing ? (
        <div>
          <p><strong>Status:</strong> {profile.status} | <strong>Win Rate:</strong> {profile.winRate}%</p>
          <p><strong>Wins:</strong> {profile.wins} | <strong>Races:</strong> {profile.races}</p>
          <p><strong>Experience:</strong> {profile.experience || 'N/A'} năm | <strong>Age:</strong> {profile.age || 'N/A'}</p>
          <p><strong>Bio:</strong> {profile.bio || 'Chưa có'}</p>
          <p><strong>Specialties:</strong> {(profile.specialties || []).join(', ') || 'Chưa có'}</p>
          <button className="btn" onClick={() => setEditing(true)}>Edit Profile</button>
        </div>
      ) : null}
      {profile && editing ? (
        <div>
          <p><label>Age: </label><input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} style={{ padding: 4 }} /></p>
          <p><label>Experience (years): </label><input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} style={{ padding: 4 }} /></p>
          <p><label>Bio: </label><input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ padding: 4, width: '100%' }} /></p>
          <p><label>Specialties: </label><input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} style={{ padding: 4, width: '100%' }} /></p>
          <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button className="btn" onClick={() => setEditing(false)} style={{ marginLeft: 8 }}>Cancel</button>
        </div>
      ) : null}
    </div>
  )
}
