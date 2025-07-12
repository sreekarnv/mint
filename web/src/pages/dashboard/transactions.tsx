import React from 'react';
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
	type Transaction,
	type TransactionsResponse,
} from '@/types/transactions';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import { Link } from 'react-router';

async function fetchTransactions({
	limit = 10,
	cursor,
}: {
	limit?: number;
	cursor?: string | null;
}): Promise<TransactionsResponse> {
	const params = new URLSearchParams();
	params.set('limit', String(limit));
	if (cursor) {
		params.set('cursor', cursor);
	}

	const url = `/api/transactions/?${params.toString()}`;

	return await fetcher<TransactionsResponse>(url, {
		method: 'GET',
	});
}

function useTransactions(limit = 10) {
	return useInfiniteQuery<
		TransactionsResponse,
		Error,
		TransactionsResponse,
		(string | number)[],
		string | null | undefined
	>({
		queryKey: ['transactions', limit],
		queryFn: ({ pageParam }) =>
			fetchTransactions({
				limit,
				cursor: pageParam ?? null,
			}),
		initialPageParam: null,
		getNextPageParam: (lastPage) => {
			return lastPage?.data?.nextCursor || undefined;
		},
	});
}

const columns = [
	{
		accessorKey: '_id',
		header: 'ID',
	},
	{
		accessorKey: 'to',
		header: 'To',
	},
	{
		accessorKey: 'amount',
		header: 'Amount ($)',
		cell: (info) => `$${info.getValue()}`,
	},
	{
		accessorKey: 'status',
		header: 'Status',
	},
	{
		accessorKey: 'type',
		header: 'Type',
	},
	{
		accessorKey: 'createdAt',
		header: 'Date',
		cell: (info) => new Date(info.getValue()).toLocaleString(),
	},
];

const DashboardTransactionsPage: React.FC = () => {
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useTransactions(10);

	const allRows: Transaction[] =
		data?.pages?.flatMap((page) => page?.data?.transactions || []) || [];

	const table = useReactTable({
		data: allRows,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});
	return (
		<div className='p-6 max-w-7xl mx-auto'>
			<div className='mb-7'>
				<Link className='hover:underline text-sm' to='/dashboard'>
					Back to Dashboard
				</Link>
			</div>

			<h1 className='text-2xl font-bold mb-4'>Transactions</h1>

			{isLoading ? (
				<div>Loading transactions...</div>
			) : (
				<>
					<table className='min-w-full border text-sm'>
						<thead className='bg-gray-100'>
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											className='px-3 py-2 text-left border-b font-medium'>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
												  )}
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.map((row) => (
								<tr key={row.id} className='border-b'>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className='px-3 py-2'>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>

					<div className='mt-4'>
						<Button
							disabled={!hasNextPage || isFetchingNextPage}
							onClick={() => fetchNextPage()}>
							{isFetchingNextPage
								? 'Loading more...'
								: hasNextPage
								? 'Load More'
								: 'No more transactions'}
						</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default DashboardTransactionsPage;
