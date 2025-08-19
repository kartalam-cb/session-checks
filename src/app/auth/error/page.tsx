 interface DefaultPageProps<
     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
     // @ts-expect-error
    TParams extends Record<string, never> = object,
     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
     // @ts-expect-error
     TSearch extends Record<string, never> = object,
> {
    params: Promise<TParams>;
    searchParams: Promise<
        { [key: string]: string | string[] | undefined } & TSearch
    >;
}

export default async function AuthErrorPage({params, searchParams}: DefaultPageProps) {
    const errorParams = await params;
    const errorSearchParams = await searchParams;

    console.log("Error Params:", errorParams);
    console.log("Error Search Params:", errorSearchParams);
    return <div>Auth Error Page</div>
}