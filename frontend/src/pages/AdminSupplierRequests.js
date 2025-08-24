// src/pages/AdminSupplierRequests.js
import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import {
  Container, Typography, Card, CardContent,
  Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, Alert, LinearProgress, Stack, TablePagination
} from "@mui/material";

const statusColor = (s) => (s === "approved" ? "success" : s === "rejected" ? "error" : "warning");

export default function AdminSupplierRequests() {
  const [rows, setRows] = useState([]);     // current page rows
  const [count, setCount] = useState(0);    // total rows (server)
  const [page, setPage] = useState(0);      // zero-based for UI
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = { page: page + 1, page_size: pageSize }; // DRF expects 1-based page
      const { data } = await api.get("/auth/admin/supplier-requests/", { params });
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setRows(list);
      setCount(typeof data?.count === "number" ? data.count : list.length);
    } catch (e) {
      setErr("Failed to load requests");
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/auth/admin/supplier-requests/${id}/`, { status });
      fetchData();
    } catch {
      setErr("Failed to update request");
    }
  };

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setPageSize(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Supplier Requests</Typography>
        <Button variant="outlined" size="small" onClick={fetchData}>Refresh</Button>
      </Stack>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.username || r.user?.username || "—"}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {r.email || r.user?.email || "—"}
                    </TableCell>
                    <TableCell>{r.company}</TableCell>
                    <TableCell sx={{ maxWidth: 440, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.reason || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip label={r.status} color={statusColor(r.status)} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      {r.status === "pending" ? (
                        <>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => updateStatus(r.id, "approved")}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => updateStatus(r.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No actions</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    {loading ? "Loading…" : "No requests found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Table pagination */}
          <TablePagination
            component="div"
            count={count}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>
    </Container>
  );
}
