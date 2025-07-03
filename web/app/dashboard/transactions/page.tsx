import { transactionsQuery } from '../_queries/transactions-query';
import TransactionTable from '@/components/transactions/transactions-table';

async function DashboardTransactionsPage({
	searchParams,
}: {
	searchParams?: { [key: string]: string | string[] };
}) {
	const _searchParams = await searchParams;
	const cursor =
		typeof _searchParams?.cursor === 'string'
			? _searchParams.cursor
			: undefined;

	const limit = _searchParams?.limit
		? parseInt(_searchParams.limit as string)
		: 5;

	const initialData = await transactionsQuery({ cursor, limit });

	return (
		<div className='p-6'>
			<TransactionTable initialData={initialData} initialLimit={limit} />
		</div>
	);
}

export default DashboardTransactionsPage;
