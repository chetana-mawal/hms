import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Col, ProgressBar, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api';
import formatCurrency from '../formatCurrency';

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [roomResponse, bookingResponse] = await Promise.all([
          api.get('/rooms'),
          api.get('/bookings')
        ]);
        setRooms(roomResponse.data);
        setBookings(bookingResponse.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Could not load hotel overview. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const occupied = rooms.filter((room) => room.status === 'Booked').length;
    const active = bookings.filter((booking) =>
      ['Pending', 'Confirmed'].includes(booking.status)
    ).length;
    const revenue = bookings
      .filter((booking) => booking.status !== 'Cancelled')
      .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

    return {
      totalRooms: rooms.length,
      available: rooms.filter((room) => room.status === 'Available').length,
      occupied,
      active,
      revenue,
      occupancy: rooms.length ? Math.round((occupied / rooms.length) * 100) : 0
    };
  }, [rooms, bookings]);

  const recentBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [bookings]
  );

  return (
    <div className="anim-fade-in">
      <div className="page-heading d-flex flex-wrap align-items-end justify-content-between gap-3">
        <div>
          <span className="page-eyebrow">Hotel operations</span>
          <h1 className="page-title">Good day, {user?.name || 'there'}</h1>
          <p className="page-subtitle">Here’s what’s happening at your property today.</p>
        </div>
        <div className="today-chip">
          <i className="bi bi-calendar3" />
          {new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <div className="loading-state"><Spinner animation="border" size="sm" /> Loading your overview…</div>
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col sm={6} xl={3}>
              <div className="surface-card metric-card">
                <div>
                  <div className="metric-label">Total rooms</div>
                  <div className="metric-value">{stats.totalRooms}</div>
                  <span className="metric-note">{stats.available} ready for guests</span>
                </div>
                <span className="metric-icon"><i className="bi bi-door-open" /></span>
              </div>
            </Col>
            <Col sm={6} xl={3}>
              <div className="surface-card metric-card">
                <div>
                  <div className="metric-label">Active bookings</div>
                  <div className="metric-value">{stats.active}</div>
                  <span className="metric-note">Pending or confirmed stays</span>
                </div>
                <span className="metric-icon metric-icon-blue"><i className="bi bi-journal-check" /></span>
              </div>
            </Col>
            <Col sm={6} xl={3}>
              <div className="surface-card metric-card">
                <div>
                  <div className="metric-label">Occupancy rate</div>
                  <div className="metric-value">{stats.occupancy}<span className="metric-unit">%</span></div>
                  <span className="metric-note">{stats.occupied} {stats.occupied === 1 ? 'room' : 'rooms'} currently booked</span>
                </div>
                <span className="metric-icon metric-icon-violet"><i className="bi bi-pie-chart" /></span>
              </div>
            </Col>
            <Col sm={6} xl={3}>
              <div className="surface-card metric-card">
                <div>
                  <div className="metric-label">Booking value</div>
                  <div className="metric-value">{formatCurrency(stats.revenue)}</div>
                  <span className="metric-note">Excluding cancelled bookings</span>
                </div>
                <span className="metric-icon metric-icon-gold"><i className="bi bi-currency-dollar" /></span>
              </div>
            </Col>
          </Row>

          <Row className="g-3">
            <Col lg={7}>
              <section className="surface-card section-card">
                <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                  <div>
                    <h2 className="section-title">Recent bookings</h2>
                    <p className="section-caption">Keep an eye on the latest guest activity.</p>
                  </div>
                  <Link to="/bookings" className="text-link">All bookings <i className="bi bi-arrow-right" /></Link>
                </div>
                {recentBookings.length === 0 ? (
                  <div className="empty-state compact-empty">
                    <i className="bi bi-calendar2-check empty-state-icon" />
                    <p className="mb-0">No bookings yet. New reservations will show up here.</p>
                  </div>
                ) : (
                  <div className="recent-list">
                    {recentBookings.map((booking) => (
                      <div className="recent-booking" key={booking._id}>
                        <div className="guest-avatar">{(booking.customer?.user?.name || 'G').charAt(0).toUpperCase()}</div>
                        <div className="recent-guest">
                          <strong>{booking.customer?.user?.name || 'Guest'}</strong>
                          <span>Room {booking.room?.roomNumber || '—'} · {formatDate(booking.checkInDate)}</span>
                        </div>
                        <div className="recent-booking-meta">
                          <strong>{formatCurrency(booking.totalPrice)}</strong>
                          <span className={`status-badge status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </Col>
            <Col lg={5}>
              <section className="surface-card section-card h-100">
                <div className="mb-3">
                  <h2 className="section-title">Room availability</h2>
                  <p className="section-caption">A quick look at your room inventory.</p>
                </div>
                <div className="availability-summary">
                  <span className="availability-number">{stats.occupancy}%</span>
                  <span className="availability-label">occupied right now</span>
                </div>
                <ProgressBar now={stats.occupancy} className="occupancy-progress availability-progress" aria-label={`${stats.occupancy}% occupancy`} />
                <div className="occupancy-row">
                  <span className="occupancy-label"><span className="legend-dot legend-available" /> Available</span>
                  <span className="occupancy-value">{stats.available} rooms</span>
                </div>
                <div className="occupancy-row">
                  <span className="occupancy-label"><span className="legend-dot legend-booked" /> Occupied</span>
                  <span className="occupancy-value">{stats.occupied} {stats.occupied === 1 ? 'room' : 'rooms'}</span>
                </div>
                <div className="occupancy-row">
                  <span className="occupancy-label"><span className="legend-dot legend-maintenance" /> Maintenance</span>
                  <span className="occupancy-value">{rooms.filter((room) => room.status === 'Maintenance').length} rooms</span>
                </div>
                <Link to="/rooms" className="btn btn-outline-success availability-link">Manage rooms <i className="bi bi-arrow-right ms-1" /></Link>
              </section>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
