import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import formatCurrency from '../formatCurrency';

const emptyRoom = {
  roomNumber: '',
  type: 'Single',
  pricePerNight: '',
  status: 'Available',
  amenities: '',
  description: ''
};

const Rooms = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isManager = user?.role === 'Admin' || user?.role === 'Staff';
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All rooms');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(emptyRoom);

  const loadRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const filteredRooms = useMemo(() => rooms.filter((room) => {
    const matchesStatus = filter === 'All rooms' || room.status === filter;
    const search = query.trim().toLowerCase();
    const matchesQuery = !search || [room.roomNumber, room.type, ...(room.amenities || [])]
      .some((value) => String(value).toLowerCase().includes(search));
    return matchesStatus && matchesQuery;
  }), [rooms, filter, query]);

  const openCreate = () => {
    setEditingRoom(null);
    setForm(emptyRoom);
    setError('');
    setShowModal(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setForm({
      ...room,
      pricePerNight: String(room.pricePerNight),
      amenities: (room.amenities || []).join(', ')
    });
    setError('');
    setShowModal(true);
  };

  const submitRoom = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const roomData = {
      roomNumber: form.roomNumber.trim(),
      type: form.type,
      pricePerNight: Number(form.pricePerNight),
      status: form.status,
      amenities: form.amenities.split(',').map((amenity) => amenity.trim()).filter(Boolean),
      description: form.description.trim()
    };

    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, roomData);
        setSuccess('Room details updated.');
      } else {
        await api.post('/rooms', roomData);
        setSuccess('Room added to your inventory.');
      }
      setShowModal(false);
      await loadRooms();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save room. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRoom = async (room) => {
    if (!window.confirm(`Remove room ${room.roomNumber} from the inventory?`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/rooms/${room._id}`);
      setRooms((current) => current.filter((item) => item._id !== room._id));
      setSuccess(`Room ${room.roomNumber} removed.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not remove room. Please try again.');
    }
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
  };

  return (
    <div className="anim-fade-in">
      <div className="page-heading d-flex flex-wrap align-items-end justify-content-between gap-3">
        <div>
          <span className="page-eyebrow">{isManager ? 'Property' : 'Stay somewhere lovely'}</span>
          <h1 className="page-title">{isManager ? 'Room management' : 'Find your room'}</h1>
          <p className="page-subtitle">{isManager ? 'Manage room availability, rates, and amenities.' : 'Explore our rooms and choose a stay that feels just right.'}</p>
        </div>
        {isManager && (
          <Button className="btn-primary-action" onClick={openCreate}>
            <i className="bi bi-plus-lg me-2" />Add a room
          </Button>
        )}
      </div>

      {error && !showModal && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <div className="room-toolbar surface-card">
        <div className="search-field">
          <i className="bi bi-search" />
          <Form.Control
            className="toolbar-control"
            aria-label="Search rooms"
            placeholder="Search room, type, or amenity"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Form.Select className="toolbar-control room-filter" aria-label="Filter rooms by status" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option>All rooms</option>
          <option>Available</option>
          <option>Booked</option>
          <option>Maintenance</option>
        </Form.Select>
        <span className="results-count">{filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'}</span>
      </div>

      {loading ? (
        <div className="loading-state"><Spinner animation="border" size="sm" /> Loading rooms…</div>
      ) : filteredRooms.length === 0 ? (
        <div className="surface-card empty-state">
          <i className="bi bi-door-closed empty-state-icon" />
          <h2 className="section-title">{rooms.length ? 'No matching rooms' : isManager ? 'Your rooms will appear here' : 'No rooms are listed right now'}</h2>
          <p className="section-caption">{rooms.length ? 'Try another search or status filter.' : isManager ? 'Add your first room to start managing your property.' : 'Please check back soon for availability.'}</p>
          {!rooms.length && isManager && <Button className="btn-primary-action mt-3" onClick={openCreate}><i className="bi bi-plus-lg me-2" />Add a room</Button>}
        </div>
      ) : (
        <Row className="g-3">
          {filteredRooms.map((room) => (
            <Col sm={6} xl={4} key={room._id}>
              <article className="surface-card room-card">
                <div className="room-card-top">
                  <div>
                    <span className="room-type-label">{room.type} room</span>
                    <div className="room-number">Room {room.roomNumber}</div>
                  </div>
                  <span className={`status-badge status-${room.status.toLowerCase()}`}>{room.status}</span>
                </div>
                <div className="room-card-body">
                  <div className="room-price">{formatCurrency(room.pricePerNight)} <small>/ night</small></div>
                  <p className="room-amenities mt-2 mb-3">
                    {room.amenities?.length ? room.amenities.join(' · ') : room.description || 'No amenities listed'}
                  </p>
                  <div className="room-actions">
                    {isManager ? (
                      <>
                        <Button variant="light" className="room-edit-button" onClick={() => openEdit(room)}>
                          <i className="bi bi-pencil me-2" />Edit details
                        </Button>
                        {user?.role === 'Admin' && (
                          <Button variant="light" className="room-delete-button" onClick={() => deleteRoom(room)} aria-label={`Remove room ${room.roomNumber}`}>
                            <i className="bi bi-trash3" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        className="btn-primary-action w-100"
                        disabled={room.status !== 'Available'}
                        onClick={() => navigate(`/bookings?room=${encodeURIComponent(room._id)}`)}
                      >
                        {room.status === 'Available' ? 'Book this room' : 'Currently unavailable'}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={closeModal} centered>
        <Form onSubmit={submitRoom}>
          <Modal.Header closeButton>
            <Modal.Title>{editingRoom ? `Edit room ${editingRoom.roomNumber}` : 'Add a room'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Row className="g-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Room number</Form.Label>
                  <Form.Control required maxLength={20} value={form.roomNumber} onChange={(event) => setForm({ ...form, roomNumber: event.target.value })} />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Room type</Form.Label>
                  <Form.Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                    {['Single', 'Double', 'Suite', 'Deluxe'].map((type) => <option key={type}>{type}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Rate per night (₹)</Form.Label>
                  <Form.Control type="number" min="0" step="0.01" required value={form.pricePerNight} onChange={(event) => setForm({ ...form, pricePerNight: event.target.value })} />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    {['Available', 'Booked', 'Maintenance'].map((status) => <option key={status}>{status}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Amenities</Form.Label>
                  <Form.Control placeholder="Wi-Fi, breakfast, ocean view" value={form.amenities} onChange={(event) => setForm({ ...form, amenities: event.target.value })} />
                  <Form.Text>Separate amenities with commas.</Form.Text>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Description <span className="optional-label">Optional</span></Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button type="submit" className="btn-primary-action" disabled={saving}>
              {saving ? <><Spinner size="sm" className="me-2" />Saving…</> : editingRoom ? 'Save changes' : 'Add room'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Rooms;
