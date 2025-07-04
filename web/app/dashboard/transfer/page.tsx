'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useActionState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { redirect } from 'next/navigation';
import {
	UserSearchResult,
	searchUsersAction,
} from '../_actions/search-users-action';
import {
	transferAction,
	TransferResponseState,
} from '../_actions/transfer-action';

export default function TransferPage() {
	const [to, setTo] = useState('');
	const [query, setQuery] = useState('');
	const [amount, setAmount] = useState('');

	const [debouncedQuery, setDebouncedQuery] = useState('');
	const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);

	const [state, formAction, pending] = useActionState(
		transferAction,
		null as TransferResponseState | null
	);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedQuery(query);
		}, 300);
		return () => clearTimeout(handler);
	}, [query]);

	useEffect(() => {
		if (!debouncedQuery) {
			setSearchResults([]);
			setShowDropdown(false);
			return;
		}

		(async () => {
			const results = await searchUsersAction(debouncedQuery);
			setSearchResults(results);
			setShowDropdown(true);
		})();
	}, [debouncedQuery]);

	function handleSelect(user: UserSearchResult) {
		setTo(user._id);
		setQuery(`${user.name} (${user.email})`);
		setShowDropdown(false);
	}

	useEffect(() => {
		if (state?.transactionId) {
			toast.success('Transfer initiated. It may take a moment to complete.', {
				richColors: true,
				position: 'top-center',
				onAutoClose() {
					toast.dismiss();
					redirect('/dashboard/transactions');
				},
			});
		}
	}, [state?.transactionId]);

	return (
		<div className='max-w-md mx-auto mt-10 relative'>
			<h1 className='text-2xl font-bold mb-6'>Send Money</h1>

			{state?.error && (
				<p className='text-destructive font-semibold mb-4'>{state.error}</p>
			)}

			<form className='space-y-4' action={formAction}>
				<div className='relative'>
					<Label htmlFor='to_display'>Search Recipient *</Label>
					<div className='mt-1'>
						<Input
							id='to_display'
							name='to_display'
							value={query}
							onChange={(e) => {
								setQuery(e.target.value);
								setShowDropdown(true);
							}}
							placeholder='Type name or email'
							autoComplete='off'
						/>
						<input type='hidden' name='to' value={to} />
						{state?.errors?.to && (
							<small className='text-destructive font-semibold'>
								{state.errors.to}
							</small>
						)}
					</div>

					{showDropdown && searchResults.length > 0 && (
						<div className='absolute z-10 w-full mt-1 bg-white border rounded shadow max-h-60 overflow-y-auto'>
							{searchResults.map((user) => (
								<div
									key={user._id}
									onClick={() => handleSelect(user)}
									className='px-3 py-2 hover:bg-gray-100 cursor-pointer'>
									<span className='font-medium'>{user.name}</span>{' '}
									<span className='text-gray-500'>({user.email})</span>
								</div>
							))}
						</div>
					)}
				</div>

				<div>
					<Label htmlFor='amount'>Amount *</Label>
					<div className='mt-1'>
						<Input
							id='amount'
							name='amount'
							type='number'
							min='1'
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder='Amount in dollars'
						/>
						{state?.errors?.amount && (
							<small className='text-destructive font-semibold'>
								{state.errors.amount}
							</small>
						)}
					</div>
				</div>

				<Button disabled={pending || !to} className='w-full'>
					{pending && <Loader2Icon className='animate-spin' />}
					Send Money
				</Button>
			</form>
		</div>
	);
}
