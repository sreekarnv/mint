import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router';
import type { User } from '@/types/user';

type UserSearchResult = {
	_id: string;
	name: string;
	email: string;
};

type TransferFormValues = {
	to_display: string;
	to: string;
	amount: number;
};

async function searchUsers(
	query: string,
	userId: string
): Promise<UserSearchResult[]> {
	if (!query) return [];

	const data = await fetcher<User[], void>(
		`/api/users/search?q=${encodeURIComponent(query)}`,
		{
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);

	const filteredUsers = data.filter(
		(user: UserSearchResult) => user._id !== userId
	);

	return filteredUsers;
}

const transferSchema = Yup.object()
	.shape({
		to: Yup.string().required('Recipient is required'),
		amount: Yup.number()
			.min(1, 'Amount must be at least 1')
			.required('Amount is required'),
		to_display: Yup.string().required(),
	})
	.required();

const DashboardTransferPage: React.FC = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [query, setQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');
	const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const user = queryClient.getQueryData(['auth.user']) as User;

	const form = useForm<TransferFormValues>({
		resolver: yupResolver(transferSchema),
		defaultValues: {
			to: '',
			amount: 1,
			to_display: '',
		},
	});

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
			try {
				const results = await searchUsers(debouncedQuery, user._id);
				setSearchResults(results);
				setShowDropdown(true);
			} catch (error) {
				console.error(error);
				toast.error('Failed to search users.');
			}
		})();
	}, [debouncedQuery, user._id]);

	const transferMutation = useMutation({
		mutationFn: async (body: TransferFormValues) => {
			return await fetcher<{ transactionId: string }, TransferFormValues>(
				'/api/transactions/transfer',
				{
					method: 'POST',
					body,
				}
			);
		},
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ['transactions'],
			});
			toast.success('Transfer initiated. It may take a moment to complete.', {
				richColors: true,
				position: 'top-center',
				onAutoClose() {
					toast.dismiss();
					navigate('/dashboard/transactions');
				},
			});
		},
		onError(error: Error) {
			toast.error(error.message, {
				position: 'top-center',
			});
		},
	});

	function handleSelect(user: UserSearchResult) {
		form.setValue('to', user._id);
		form.setValue('to_display', `${user.name} (${user.email})`);
		setQuery(`${user.name} (${user.email})`);
		setShowDropdown(false);
	}

	const onSubmit = (values: TransferFormValues) => {
		transferMutation.mutate(values);
	};

	return (
		<div className='max-w-lg mx-auto mt-10 relative'>
			<div className='mb-7'>
				<Link className='hover:underline text-sm' to='/dashboard'>
					Back to Dashboard
				</Link>
			</div>

			<h1 className='text-2xl font-bold mb-6 text-center'>Send Money</h1>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
					<FormField
						control={form.control}
						name='to_display'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Search Recipient *</FormLabel>
								<FormControl>
									<div className='relative'>
										<Input
											{...field}
											value={query}
											onChange={(e) => {
												setQuery(e.target.value);
												setShowDropdown(true);
											}}
											placeholder='Type name or email'
											autoComplete='off'
										/>
										<input type='hidden' {...form.register('to')} />

										{showDropdown && searchResults.length > 0 && (
											<div className='absolute z-10 w-full mt-1 bg-white border rounded shadow max-h-60 overflow-y-auto'>
												{searchResults.map((user) => (
													<div
														key={user._id}
														onClick={() => handleSelect(user)}
														className='px-3 py-2 hover:bg-gray-100 cursor-pointer'>
														<span className='font-medium'>{user.name}</span>{' '}
														<span className='text-gray-500'>
															({user.email})
														</span>
													</div>
												))}
											</div>
										)}
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name='amount'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Amount *</FormLabel>
								<FormControl>
									<Input type='number' {...field} min={1} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type='submit'
						disabled={transferMutation.isPending || !form.getValues().to}
						className='w-full'>
						{transferMutation.isPending && (
							<Loader2Icon className='animate-spin' />
						)}
						Send Money
					</Button>
				</form>
			</Form>
		</div>
	);
};

export default DashboardTransferPage;
