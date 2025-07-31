import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Toolbar,
  Alert,
  AppBar,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel, GridRowId } from '@mui/x-data-grid';
import {
  Block as BlockIcon,
  LockOpen as UnblockIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { authAPI, User } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const UsersDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set<GridRowId>(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { logout, user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleAuthError = (errorMessage: any) => {
    if(errorMessage === 'User blocked or not found') {
          toast.error('Session expired or access denied. Please login again.');
          logout();
          navigate('/login', { replace: true });
          return true;
    }else {
          return false;
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const userData = await authAPI.getUsers(user?.id);
      setUsers(userData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch users';
      
      if (!handleAuthError(errorMessage)) {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    setSelectedUsers(newSelection);
  };

  const getSelectedIds = useMemo(() => {
    const allIds = users.map(user => user.id);

    if (Array.isArray(selectedUsers)) {
      return selectedUsers.map(id => Number(id));
    } else if (selectedUsers?.type === "include") {
      return Array.from(selectedUsers.ids).map(id => Number(id));
    } else if (selectedUsers?.type === "exclude") {
      return allIds.filter(id => !selectedUsers.ids.has(id));
    }
    return [];
  }, [selectedUsers, users]);

  const getSelectionLength = (): number => {
    if (Array.isArray(selectedUsers)) {
      return selectedUsers.length;
    } else if (selectedUsers?.type === "include") {
      return selectedUsers.ids.size;
    }
    return 0;
  };

  const clearSelection = (): GridRowSelectionModel => ({
    type: "include",
    ids: new Set(),
  });

  const handleBlock = async () => {
    if (getSelectedIds.length === 0) return;
    
    try {
      await authAPI.updateUserStatus(getSelectedIds, true);
      const successMessage = 'Users blocked successfully';
      setSuccess(successMessage);
      toast.success(successMessage);
      fetchUsers();
      setSelectedUsers(clearSelection());
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to block users';
      setError(errorMessage);
      toast.error(errorMessage);
      handleAuthError(errorMessage);
    }
  };

  const handleUnblock = async () => {
    if (getSelectedIds.length === 0) return;
    
    try {
      await authAPI.updateUserStatus(getSelectedIds, false);
      const successMessage = 'Users unblocked successfully';
      setSuccess(successMessage);
      toast.success(successMessage);
      fetchUsers();
      setSelectedUsers(clearSelection());
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to unblock users';
      setError(errorMessage);
      toast.error(errorMessage);
      handleAuthError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (getSelectedIds.length === 0) return;
    
    if (window.confirm('Are you sure you want to delete selected users?')) {
      try {
        await authAPI.deleteUsers(getSelectedIds);
        const successMessage = 'Users deleted successfully';
        setSuccess(successMessage);
        toast.success(successMessage);
        fetchUsers();
        setSelectedUsers(clearSelection());
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to delete users';
        setError(errorMessage);
        toast.error(errorMessage);
        handleAuthError(errorMessage);
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 90,
      sortable: true,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 100,
      sortable: true,
    },
    {
      field: 'last_login',
      headerName: 'Last Login',
      flex: 2,
      minWidth: 150,
      sortable: true,
      valueFormatter: (value: any) => {
        if (!value) return 'Never';
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
      },
    },
    {
      field: 'is_blocked',
      headerName: 'Status',
      flex: 1,
      minWidth: 50,
      renderCell: (params: any) => (
        <Typography color={params.value ? 'error' : 'success'}>
          {params.value ? 'Blocked' : 'Active'}
        </Typography>
      ),
    },
  ];

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Users Management - Welcome, {user?.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton color="inherit" onClick={toggleTheme}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{mt: 4, px: { xs: 1, sm: 2, md: 3, lg: 4 },width: '100%'}}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Paper sx={{p: { xs: 1, sm: 2 },width: '100%', overflowX: 'auto' }}>
          <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              rowGap: 1,
              columnGap: 2,
              mb: 2,
            }}
          >
            <Typography variant="h5" gutterBottom>
              Users Table
            </Typography>
            
            <Toolbar sx={{p: 0,display: 'flex',gap: 1,flexWrap: 'wrap', minHeight: 'auto',}}>
              <Button
                variant="contained"
                startIcon={<BlockIcon />}
                onClick={handleBlock}
                disabled={getSelectedIds.length === 0}
                sx={{ mr: 1 }}
              >
                Block
              </Button>
              
              <IconButton
                onClick={handleUnblock}
                color="secondary"
                disabled={getSelectedIds.length === 0}
                sx={{ mr: 1 }}
              >
                <UnblockIcon />
              </IconButton>

              <IconButton
                onClick={handleDelete}
                color="error"
                disabled={getSelectedIds.length === 0}
              >
                <DeleteIcon />
              </IconButton>
            </Toolbar>
          </Box>

          <Box sx={{ height: '100%', width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={users}
              columns={columns}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedUsers}
              onRowSelectionModelChange={handleSelectionChange}
              loading={loading}
              density="compact"
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
                sorting: {
                  sortModel: [{ field: 'last_login', sort: 'desc' }],
                },
              }}
            />
          </Box>
        </Paper>
      </Container>
    </div>
  );
};

export default UsersDashboard;