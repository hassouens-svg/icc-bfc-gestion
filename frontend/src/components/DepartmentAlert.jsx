import React, { useEffect } from 'react';
import { toast } from 'sonner';

const DepartmentAlert = ({ department, view = null }) => {
  useEffect(() => {
    const message = view 
      ? `📊 Vous êtes sur la vue ${view}`
      : `🏢 Vous êtes sur le département ${department}`;
    
    toast.info(message, {
      duration: 3000,
      position: 'top-center'
    });
  }, [department, view]);

  return null;
};

export default DepartmentAlert;
