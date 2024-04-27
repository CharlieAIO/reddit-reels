import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Privacy Policy for Reddit Reels</h1>
            <p className="text-xl mb-2"><strong>Last Updated:</strong> 16/10/2023</p>

            {/* Sections */}
            <div className="text-lg space-y-4">
                {/* Information We Collect */}
                <section>
                    <h2 className="font-bold">1. Information We Collect</h2>
                    <p>We collect various categories of personal information, including but not limited to:</p>
                    <ul>
                        <li>Username</li>
                        <li>Email</li>
                        <li>Password</li>
                        {/* Add other categories here */}
                    </ul>
                </section>

                {/* Use of Information */}
                <section>
                    <h2 className="font-bold">2. Use of Information</h2>
                    <p>We use the information we collect for various purposes, including to:</p>
                    <ul>
                        <li>Provide, maintain, and improve our Services</li>
                        <li>Respond to your comments and questions</li>
                        <li>Send you updates and promotional materials</li>
                        {/* Add other purposes here */}
                    </ul>
                </section>

                {/* Sharing of Information */}
                <section>
                    <h2 className="font-bold">3. Sharing of Information</h2>
                    <p>We do not share your personal information with third parties unless we have your explicit consent or are required to do so by law.</p>
                    {/* Add details about third-party sharing here */}
                </section>

                {/* Security */}
                <section>
                    <h2 className="font-bold">4. Security</h2>
                    <p>We take reasonable measures to protect your personal information. However, no method of transmission over the internet or electronic storage is entirely secure, and we cannot guarantee absolute security.</p>
                    {/* Explain security measures here */}
                </section>

                {/* Changes to This Policy */}
                <section>
                    <h2 className="font-bold">5. Changes to This Policy</h2>
                    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the updated policy on this page.</p>
                </section>

                {/* User Rights */}
                <section>
                    <h2 className="font-bold">6. User Rights</h2>
                    <p>As a user, you have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Rectify inaccuracies in your personal data</li>
                        <li>Request the erasure of your personal data</li>
                        {/* Add other user rights here */}
                    </ul>
                </section>

                {/* Contact Us */}
                <section>
                    <h2 className="font-bold">7. Contact Us</h2>
                    <p>For any questions about this Privacy Policy, exercising your rights, or any other privacy-related concerns, please contact us at support@redditreels.com.</p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
