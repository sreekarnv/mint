'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { fetchTransactions } from '@/app/dashboard/_actions/transactions-action';
import {
	Transaction,
	TransactionsResponse,
} from '@/app/dashboard/_queries/transactions-query';

type Props = {
	initialData: TransactionsResponse | null;
	initialLimit: number;
};

export default function TransactionTable({ initialData, initialLimit }: Props) {
	const [transactions, setTransactions] = useState<Transaction[]>(
		initialData?.data?.transactions || []
	);
	const [nextCursor, setNextCursor] = useState<string | null>(
		initialData?.data?.nextCursor || null
	);
	const [loading, setLoading] = useState(false);

	const [limit] = useState<number>(initialLimit);
	const [pendingLimit, setPendingLimit] = useState<number>(initialLimit);

	async function handleLoadMore() {
		if (!nextCursor) return;

		setLoading(true);
		const data = await fetchTransactions(nextCursor, limit);
		const newTxns = data?.data?.transactions || [];
		setTransactions((prev) => [...prev, ...newTxns]);
		setNextCursor(data?.data?.nextCursor || null);
		setLoading(false);
	}

	function handleApplyLimit() {
		window.location.href = `/dashboard/transactions?limit=${pendingLimit}`;
	}

	return (
		<div className='space-y-4'>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-xl font-semibold'>Your Transactions</h1>
				<div className='flex items-center gap-2'>
					<span className='text-sm'>Rows per page:</span>
					<Select
						value={pendingLimit.toString()}
						onValueChange={(val: string) => setPendingLimit(parseInt(val))}>
						<SelectTrigger className='w-20'>
							<SelectValue placeholder='Select' />
						</SelectTrigger>
						<SelectContent>
							{[5, 10, 15, 20, 25].map((val) => (
								<SelectItem key={val} value={val.toString()}>
									{val}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						variant='outline'
						size='sm'
						onClick={handleApplyLimit}
						disabled={pendingLimit === limit}>
						Apply
					</Button>
				</div>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Date & Time</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{transactions.length === 0 ? (
						<TableRow>
							<TableCell colSpan={4} className='text-center text-gray-500 py-6'>
								No transactions found.
							</TableCell>
						</TableRow>
					) : (
						transactions.map((txn) => (
							<TableRow key={txn._id}>
								<TableCell>
									{new Date(txn.createdAt).toLocaleString()}
								</TableCell>
								<TableCell className='capitalize'>{txn.type}</TableCell>
								<TableCell>${txn.amount}</TableCell>
								<TableCell>
									<Badge
										variant={
											txn.status === 'success'
												? 'success'
												: txn.status === 'pending'
												? 'secondary'
												: 'destructive'
										}>
										{txn.status}
									</Badge>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			<div className='flex justify-center mt-4'>
				{nextCursor && (
					<Button onClick={handleLoadMore} disabled={loading}>
						{loading ? 'Loading...' : 'Load More'}
					</Button>
				)}
			</div>
		</div>
	);
}
