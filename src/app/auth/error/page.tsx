// Make the entire file a server component
import { ErrorActions } from "./ErrorClient";

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

interface ErrorInfo {
    title: string;
    message: string;
    action?: string;
}

// Function to get more user-friendly error messages for known Azure B2C errors
function getErrorDetails(error: string, description?: string): ErrorInfo {
    // Check for Azure B2C specific error codes
    if (description?.includes('AADB2C90085')) {
        return {
            title: 'Azure B2C Temporary Issue',
            message: 'The authentication service is experiencing temporary issues. Please try again in a few moments.',
            action: 'Try again shortly'
        };
    }
    
    if (description?.includes('AADB2C90088')) {
        return {
            title: 'Password Expired',
            message: 'Your password has expired and must be reset.',
            action: 'Reset password'
        };
    }
    
    if (description?.includes('AADB2C999002')) {
        return {
            title: 'Invalid Credentials',
            message: 'The username or password you entered is incorrect.',
            action: 'Try again with correct credentials'
        };
    }
    
    // Handle other common errors
    switch (error) {
        case 'Configuration':
            return {
                title: 'Configuration Error',
                message: 'There is an issue with the authentication configuration. Please contact support.',
            };
        case 'AccessDenied':
            return {
                title: 'Access Denied',
                message: 'You do not have permission to sign in to this application.',
            };
        case 'Verification':
            return {
                title: 'Verification Required',
                message: 'Please verify your account before signing in.',
            };
        case 'OAuthCallback':
            return {
                title: 'Authentication Failed',
                message: 'There was a problem during the authentication process. This might be a temporary issue.',
                action: 'Try again'
            };
        case 'OAuthAccountNotLinked':
            return {
                title: 'Account Not Linked',
                message: 'To confirm your identity, sign in with the same account you used originally.',
            };
        case 'CallbackRouteError':
            return {
                title: 'Authentication Process Error',
                message: 'There was an error during the authentication callback process. ' + 
                         (description || 'Please try again or contact support.'),
                action: 'Try again'
            };
        default:
            return {
                title: 'Authentication Error',
                message: 'An unexpected error occurred during sign in. Please try again.',
            };
    }
}

export default async function AuthErrorPage({searchParams}: DefaultPageProps) {
    const errorSearchParams = await searchParams;
    const error = errorSearchParams.error as string;
    const errorDescription = errorSearchParams.error_description as string;

    console.log("Auth Error:", error);
    console.log("Error Description:", errorDescription);
    
    // Get user-friendly error details
    const errorDetails = getErrorDetails(error, errorDescription);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-xl shadow-md">
                <h1 className="text-2xl font-bold text-red-600">{errorDetails.title}</h1>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-gray-700">{errorDetails.message}</p>
                    
                    {errorDetails.action && (
                        <p className="mt-2 text-sm font-medium text-gray-600">
                            Recommended action: {errorDetails.action}
                        </p>
                    )}
                    
                    {(error || errorDescription) && (
                        <details className="mt-4">
                            <summary className="text-sm text-gray-500 cursor-pointer">
                                Technical details
                            </summary>
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto">
                                {error && <p>Error: {error}</p>}
                                {errorDescription && <p className="mt-1">Description: {errorDescription}</p>}
                            </div>
                        </details>
                    )}
                </div>
                
                <div className="mt-6 flex flex-col items-center">
                    <ErrorActions />
                </div>
            </div>
        </div>
    );
}