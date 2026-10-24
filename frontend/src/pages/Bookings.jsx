import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import formatCurrency from '../formatCurrency';

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

const emptyReservation = { customer: '', room: '', checkInDate: '', checkOutDate: '' };

const Bookings = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isManager = user?.role === 'Admin' || user?.role === 'Staff';
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [updatingId, setUpdatingId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [reservation, setReservation] = useState(emptyReservation);

  const loadBookings = useCallback(async () => {
    try {
      const { data } = await api.get('/bookings');
      setBookings(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const filteredBookings = useMemo(() => bookings.filter((booking) => {
    const statusMatches = statusFilter === 'All statuses' || booking.status === statusFilter;
    const search = query.trim().toLowerCase();
    const searchMatches = !search || [
      booking.customer?.user?.name,
      booking.customer?.user?.email,
      booking.room?.roomNumber,
      booking._id
    ].some((value) => String(value || '').toLowerCase().includes(search));
    return statusMatches && searchMatches;
  }), [bookings, query, statusFilter]);

  const selectedRoom = rooms.find((room) => room._id === reservation.room);
  const nights = reservation.checkInDate && reservation.checkOutDate
    ? Math.max(0, Math.ceil((Date.parse(reservation.checkOutDate) - Date.parse(reservation.checkInDate)) / 86400000))
    : 0;
  const estimatedTotal = selectedRoom && nights > 0 ? selectedRoom.pricePerNight * nights : 0;

  const openCreateDialog = useCallback(async (roomId = '') => {
    setDialogError('');
    setSuccess('');
    setReservation({ ...emptyReservation, room: roomId });
    setShowCreate(true);
    try {
      const [customerResponse, roomResponse] = await Promise.all([
        isManager ? api.get('/customers') : Promise.resolve({ data: [] }),
        api.get('/rooms')
      ]);
      setCustomers(customerResponse.data);
      setRooms(roomResponse.data.filter((room) => room.status === 'Available'));
    } catch (requestError) {
      setDialogError(requestError.response?.data?.message || 'Could not load guests and available rooms.');
    }
  }, [isManager]);

  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId && !isManager) {
      void openCreateDialog(roomId);
      setSearchParams({}, { replace: true });
    }
  }, [isManager, openCreateDialog, searchParams, setSearchParams]);

  const createReservation = async (event) => {
    event.preventDefault();
    if (!nights || !selectedRoom || (isManager && !reservation.customer)) {
      setDialogError('Choose a guest, an available room, and valid stay dates.');
      return;
    }
    setSaving(true);
    setDialogError('');
    try {
      await api.post('/bookings', { ...reservation, totalPrice: estimatedTotal });
      setShowCreate(false);
      setSuccess('Reservation created successfully.');
      await loadBookings();
    } catch (requestError) {
      setDialogError(requestError.response?.data?.message || 'Could not create reservation.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (booking, status) => {
    if (status === booking.status) return;
    setUpdatingId(booking._id);
    setError('');
    try {
      const { data } = await api.put(`/bookings/${booking._id}`, { status });
      setBookings((current) => current.map((item) => item._id === booking._id ? data : item));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update booking status.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="anim-fade-in">
      <div className="page-heading d-flex flex-wrap align-items-end justify-content-between gap-3">
        <div>
          <span className="page-eyebrow">{isManager ? 'Guest stays' : 'Your account'}</span>
          <h1 className="page-title">{isManager ? 'Bookings' : 'My stays'}</h1>
          <p className="page-subtitle">{isManager ? 'Track reservations, guest details, and stay status.' : 'View your reservations and manage your upcoming stays.'}</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="booking-total"><i className="bi bi-calendar2-week me-2" />{bookings.length} {isManager ? 'total reservations' : 'reservations'}</span>
          <Button className="btn-primary-action" onClick={() => openCreateDialog()}>
            <i className="bi bi-plus-lg me-2" />{isManager ? 'New reservation' : 'Book a room'}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <div className="booking-toolbar surface-card">
        <div className="search-field">
          <i className="bi bi-search" />
          <Form.Control
            className="toolbar-control"
            aria-label="Search bookings"
            placeholder={isManager ? 'Search guest, room, or booking ID' : 'Search room or booking ID'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Form.Select className="toolbar-control booking-filter" aria-label="Filter bookings by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All statuses</option>
          {['Pending', 'Confirmed', 'Cancelled', 'Completed'].map((status) => <option key={status}>{status}</option>)}
        </Form.Select>
        <span className="results-count">{filteredBookings.length} shown</span>
      </div>

      <section className="surface-card table-panel">
        {loading ? (
          <div className="loading-state"><Spinner animation="border" size="sm" /> Loading reservations…</div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-calendar2-x empty-state-icon" />
            <h2 className="section-title">{bookings.length ? 'No matching bookings' : 'No bookings yet'}</h2>
            <p className="section-caption">{bookings.length ? 'Change your search or status filter.' : 'Reservations will appear here when they are created.'}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  {isManager && <th>Guest</th>}
                  <th>Room</th>
                  <th>Stay dates</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th><span className="visually-hidden">Update status</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking._id}>
                    {isManager && <td>
                      <div className="table-guest">
                        <span className="guest-avatar">{(booking.customer?.user?.name || 'G').charAt(0).toUpperCase()}</span>
                        <span>
                          <strong>{booking.customer?.user?.name || 'Guest'}</strong>
                          <small>{booking.customer?.user?.email || `Booking #${booking._id.slice(0, 8)}`}</small>
                        </span>
                      </div>
                    </td>}
                    <td><span className="room-cell">{booking.room?.roomNumber || '—'}</span><small className="d-block muted-cell">{booking.room?.type || 'Room'}</small></td>
                    <td>{formatDate(booking.checkInDate)}<small className="d-block muted-cell">to {formatDate(booking.checkOutDate)}</small></td>
                    <td className="booking-value">{formatCurrency(booking.totalPrice)}</td>
                    <td><span className={`status-badge status-${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                    <td>
                      {isManager ? <Form.Select
                        className="status-select"
                        aria-label={`Update booking status for ${booking.customer?.user?.name || 'guest'}`}
                        value={booking.status}
                        disabled={updatingId === booking._id}
                        onChange={(event) => changeStatus(booking, event.target.value)}
                      >
                        {['Pending', 'Confirmed', 'Cancelled', 'Completed'].map((status) => <option key={status}>{status}</option>)}
                      </Form.Select> : ['Pending', 'Confirmed'].includes(booking.status) ? (
                        <Button
                          variant="outline-danger"
                          className="cancel-booking-button"
                          disabled={updatingId === booking._id}
                          onClick={() => changeStatus(booking, 'Cancelled')}
                        >
                          {updatingId === booking._id ? 'Cancelling…' : 'Cancel stay'}
                        </Button>
                      ) : <span className="muted-cell">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </section>
      <p className="booking-footnote"><i className="bi bi-info-circle me-1" />{isManager ? 'Changes to a reservation status are saved immediately.' : 'You can cancel pending or confirmed stays.'}</p>

      <Modal show={showCreate} onHide={() => !saving && setShowCreate(false)} centered>
        <Form onSubmit={createReservation}>
          <Modal.Header closeButton>
            <Modal.Title>New reservation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {dialogError && <Alert variant="danger">{dialogError}</Alert>}
            {isManager && !dialogError && !customers.length && (
              <Alert variant="info">There are no guest profiles yet. Create a customer profile before adding a reservation.</Alert>
            )}
            <Row className="g-3">
              {isManager ? <Col xs={12}>
                <Form.Group>
                  <Form.Label>Guest</Form.Label>
                  <Form.Select required value={reservation.customer} onChange={(event) => setReservation({ ...reservation, customer: event.target.value })} disabled={!customers.length}>
                    <option value="">Select a guest</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.user?.name || 'Guest'}{customer.user?.email ? ` · ${customer.user.email}` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col> : <Col xs={12}><div className="reservation-guest"><i className="bi bi-person-circle" /><span>Booking for <strong>{user?.name || 'your account'}</strong></span></div></Col>}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Available room</Form.Label>
                  <Form.Select required value={reservation.room} onChange={(event) => setReservation({ ...reservation, room: event.target.value })} disabled={!rooms.length}>
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        Room {room.roomNumber} · {room.type} · {formatCurrency(room.pricePerNight)} / night
                      </option>
                    ))}
                  </Form.Select>
                  {!rooms.length && <Form.Text>No rooms are currently available.</Form.Text>}
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Check-in</Form.Label>
                  <Form.Control type="date" required value={reservation.checkInDate} onChange={(event) => setReservation({ ...reservation, checkInDate: event.target.value })} />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Check-out</Form.Label>
                  <Form.Control type="date" required min={reservation.checkInDate || undefined} value={reservation.checkOutDate} onChange={(event) => setReservation({ ...reservation, checkOutDate: event.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            {selectedRoom && nights > 0 && (
              <div className="reservation-estimate">
                <span>{nights} {nights === 1 ? 'night' : 'nights'} × {formatCurrency(selectedRoom.pricePerNight)}</span>
                <strong>Estimated total <span>{formatCurrency(estimatedTotal)}</span></strong>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" className="btn-primary-action" disabled={saving || (isManager && !customers.length) || !rooms.length}>
              {saving ? <><Spinner size="sm" className="me-2" />Creating…</> : isManager ? 'Create reservation' : 'Confirm reservation'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Bookings;
