import { cookies } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

export async function POST() {
	const cookieStore = await cookies();

	cookieStore.delete('auth.token');

	redirect('/', RedirectType.replace);
}
