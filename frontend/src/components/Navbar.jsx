import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

const NavbarComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isManager = user?.role === 'Admin' || user?.role === 'Staff';
  const homeRoute = isManager ? '/dashboard' : '/rooms';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (location.pathname === '/login') {
    return (
      <Navbar className="hotel-navbar">
        <Container fluid className="hotel-navbar-inner">
          <Navbar.Brand as={Link} to={token ? homeRoute : '/login'} className="hotel-brand">
            <span className="brand-mark"><i className="bi bi-buildings" /></span>
            <span>Haven<span className="brand-light"> House</span></span>
          </Navbar.Brand>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar collapseOnSelect expand="lg" className="hotel-navbar">
      <Container fluid className="hotel-navbar-inner">
        <Navbar.Brand as={Link} to="/" className="hotel-brand">
          <span className="brand-mark"><i className="bi bi-buildings" /></span>
          <span>Haven<span className="brand-light"> House</span></span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="hotel-navigation" className="hotel-navbar-toggle" />
        <Navbar.Collapse id="hotel-navigation">
          <Nav className="hotel-nav">
            {token && (
              <>
                {isManager && <Nav.Link as={NavLink} to="/dashboard" end>Overview</Nav.Link>}
                <Nav.Link as={NavLink} to="/rooms">{isManager ? 'Rooms' : 'Find a room'}</Nav.Link>
                <Nav.Link as={NavLink} to="/bookings">{isManager ? 'Bookings' : 'My stays'}</Nav.Link>
              </>
            )}
          </Nav>
          <Nav className="hotel-account">
            {token ? (
              <div className="account-content">
                <div className="account-avatar">{(user?.name || 'H').charAt(0).toUpperCase()}</div>
                <div className="account-copy">
                  <span className="account-name">{user?.name || 'Hotel staff'}</span>
                  <span className="account-role">{user?.role || 'Team member'}</span>
                </div>
                <Button className="logout-button" variant="light" onClick={handleLogout} aria-label="Log out">
                  <i className="bi bi-box-arrow-right" />
                </Button>
              </div>
            ) : (
              <Nav.Link as={Link} to="/login" className="hotel-login-link">Sign in</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
