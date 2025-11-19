import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const DepartmentAlert = ({ department, view = null }) => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!shown) {
      const message = view 
        ? `📊 Vous êtes sur la vue ${view}`
        : `🏢 Vous êtes sur le département ${department}`;
      
      toast.info(message, {
        duration: 3000,
        position: 'top-center'
      });
      setShown(true);
    }
  }, [department, view, shown]);

  return null;
};

export default DepartmentAlert;
