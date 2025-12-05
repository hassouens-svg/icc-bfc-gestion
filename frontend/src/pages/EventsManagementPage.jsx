import React, { useState, useEffect } from 'react';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Calendar, List, Mail, MessageSquare, LogOut } from 'lucide-react';
import { getUser } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const EventsManagementPage = () => {
  const user = getUser();
  const navigate = useNavigate();

  // Check if user is logged in
  if (!user) {
    // Not logged in - redirect to login
    useEffect(() => {
      navigate('/login');
    }, [navigate]);
    return null;
  }

  // Check access - ONLY super_admin, pasteur, responsable_eglise, gestion_projet
