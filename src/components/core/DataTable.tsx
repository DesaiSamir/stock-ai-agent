import { DataGrid, DataGridProps, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { Box } from '@mui/material';

export interface DataTableProps<T> extends Omit<DataGridProps, 'columns' | 'rows' | 'onRowClick'> {
  columns: GridColDef[];
  data: T[];
  loading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (params: GridRowParams<T>) => void;
}

export const DataTable = <T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],
  onRowClick,
  ...props
}: DataTableProps<T>) => {
  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        columns={columns}
        rows={data}
        loading={loading}
        pageSizeOptions={pageSizeOptions}
        initialState={{
          pagination: {
            paginationModel: { pageSize },
          },
        }}
        onRowClick={onRowClick}
        disableRowSelectionOnClick
        {...props}
      />
    </Box>
  );
}; 