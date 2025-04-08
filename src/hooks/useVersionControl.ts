import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Version {
  id: string;
  timestamp: number;
  label: string;
  state: any;
  parent: string | null;
}

interface Branch {
  id: string;
  name: string;
  head: string; // Version ID
}

export const useVersionControl = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [branches, setBranches] = useState<Branch[]>([{
    id: 'main',
    name: 'main',
    head: 'initial'
  }]);
  const [currentBranch, setCurrentBranch] = useState('main');

  const createVersion = useCallback((state: any, label: string = '') => {
    const branch = branches.find(b => b.id === currentBranch);
    if (!branch) {
      return;
    }

    const newVersion: Version = {
      id: uuidv4(),
      timestamp: Date.now(),
      label,
      state,
      parent: branch.head
    };

    setVersions(prev => [...prev, newVersion]);
    setBranches(prev => prev.map(b => 
      b.id === currentBranch ? { ...b, head: newVersion.id } : b
    ));
  }, [currentBranch, branches]);

  const createBranch = useCallback((name: string, fromVersion: string) => {
    const branchId = uuidv4();
    setBranches(prev => [...prev, {
      id: branchId,
      name,
      head: fromVersion
    }]);
    return branchId;
  }, []);

  const switchBranch = useCallback((branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) {
      return null;
    }

    setCurrentBranch(branchId);
    return versions.find(v => v.id === branch.head)?.state || null;
  }, [branches, versions]);

  const getVersionHistory = useCallback((branchId: string = currentBranch) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) {
      return [];
    }

    const history: Version[] = [];
    let currentVersionId: string | null = branch.head;
    
    while (currentVersionId) {
      const current = versions.find(v => v.id === currentVersionId);
      if (current) {
        history.push(current);
        currentVersionId = current.parent;
      } else {
        // Should not happen in a consistent state, but good to handle
        console.warn("Could not find version:", currentVersionId);
        currentVersionId = null; 
      }
    }

    return history;
  }, [versions, branches, currentBranch]);

  return {
    createVersion,
    createBranch,
    switchBranch,
    getVersionHistory,
    currentBranch,
    branches
  };
};