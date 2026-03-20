import React from 'react';
import { SetupScreen } from './SetupScreen';
import { RotationScreen } from './RotationScreen';

export function SessionDashboard(props) {
  const { teamA } = props;
  const isSessionActive = Array.isArray(teamA) && teamA.length > 0;

  if (isSessionActive) {
    return <RotationScreen {...props} />;
  }
  
  return <SetupScreen {...props} />;
}
