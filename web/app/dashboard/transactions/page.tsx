import { transactionsQuery } from '../_queries/transactions-query';
import TransactionTable from '@/components/transactions/transactions-table';

export default async function DashboardTransactionsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] }>;
}) {
	const _searchParams = await searchParams;

	const cursor =
		typeof _searchParams?.cursor === 'string'
			? _searchParams.cursor
			: undefined;

	const limit = _searchParams?.limit
		? parseInt(
				Array.isArray(_searchParams.limit)
					? _searchParams.limit[0]
					: _searchParams.limit
		  )
		: 5;

	const initialData = await transactionsQuery({ cursor, limit });

	return (
		<div className='p-6'>
			<TransactionTable initialData={initialData} initialLimit={limit} />
		</div>
	);
}
