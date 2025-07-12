import * as Yup from 'yup';
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2Icon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router';

const topupSchema = Yup.object()
	.shape({
		amount: Yup.number().min(1).required(),
	})
	.required();

type TopupSchemaType = Yup.InferType<typeof topupSchema>;

const DashboardTopupPage: React.FC = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { isPending, mutate } = useMutation({
		mutationFn: async (body: TopupSchemaType) => {
			return await fetcher<null, TopupSchemaType>(
				'/api/transactions/wallet/topup',
				{
					method: 'POST',
					body,
				}
			);
		},
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ['wallet'],
			});
			toast.success('Topup Initated', { position: 'top-center' });
		},
		onError(error) {
			toast.error(error.message, { position: 'top-center' });
		},
		onSettled(data) {
			if (data) {
				navigate('/dashboard');
			}
		},
	});

	const form = useForm<TopupSchemaType>({
		resolver: yupResolver(topupSchema),
		defaultValues: {
			amount: 1,
		},
	});

	function onSubmit(values: TopupSchemaType) {
		mutate(values);
	}

	return (
		<>
			<div className='max-w-lg mx-auto mt-10 relative'>
				<div className='mb-7'>
					<Link className='hover:underline text-sm' to='/dashboard'>
						Back to Dashboard
					</Link>
				</div>

				<h1 className='text-2xl font-bold mb-6 text-center'>Topup</h1>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
						<FormField
							control={form.control}
							name='amount'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Amount *</FormLabel>
									<FormControl>
										<Input type='number' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button disabled={isPending} type='submit'>
							{isPending && <Loader2Icon className='animate-spin' />}
							Submit
						</Button>
					</form>
				</Form>
			</div>
		</>
	);
};

export default DashboardTopupPage;
