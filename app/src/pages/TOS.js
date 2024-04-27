import React from 'react';

const TermsOfService = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Terms of Service for Reddit Reels</h1>
            <p className="text-xl mb-2"><strong>Last Updated:</strong> 16/10/2023</p>

            {/* Sections */}
            <div className="text-lg space-y-4">
                {/* Acceptance of Terms */}
                <section>
                    <h2 className="font-bold">1. Acceptance of Terms</h2>
                    <p>By accessing or using our Services, you agree to comply with and be bound by these Terms.</p>
                </section>

                {/* Changes to Terms */}
                <section>
                    <h2 className="font-bold">2. Changes to Terms</h2>
                    <p>Reddit Reels may modify the Terms at any time, and changes will be posted on this page. You are responsible for reviewing and becoming familiar with any modifications.</p>
                </section>

                {/* Use of Our Services */}
                <section>
                    <h2 className="font-bold">3. Use of Our Services</h2>
                    <p>You may use our Services only if you are in compliance with these Terms and all applicable laws.</p>
                </section>

                {/* User Content */}
                <section>
                    <h2 className="font-bold">4. User Content</h2>
                    <p>You retain all ownership rights to the content you upload to Reddit Reels. However, by uploading content, you grant us a license to use, display, and distribute this content.</p>
                </section>

                {/* Termination */}
                <section>
                    <h2 className="font-bold">5. Termination</h2>
                    <p>We may suspend or terminate your account and access to our Services at any time, for any reason, without notice.</p>
                </section>

                {/* Disclaimers */}
                <section>
                    <h2 className="font-bold">6. Disclaimers</h2>
                    <p>Our Services are provided "as is" without any warranties of any kind, either express or implied.</p>
                </section>

                {/* Governing Law */}
                <section>
                    <h2 className="font-bold">7. Governing Law</h2>
                    <p>These Terms are governed by the laws of the State of laws of England and Wales, without regard to its conflict of laws principles.</p>
                </section>

                <section>
                    <h2 className="font-bold">8. User Conduct</h2>
                    <p>Users are expected to adhere to high standards of conduct when using Reddit Reels. Harassment, hate speech, spamming, or any behavior that violates TikTok's community guidelines is strictly prohibited.</p>
                </section>

                {/* Content Guidelines */}
                <section>
                    <h2 className="font-bold">9. Content Guidelines</h2>
                    <p>Users should familiarize themselves with our content guidelines, which outline the types of content allowed on Reddit Reels. Any content that violates these guidelines may be removed.</p>
                </section>

                {/* Copyright and Intellectual Property */}
                <section>
                    <h2 className="font-bold">10. Copyright and Intellectual Property</h2>
                    <p>Users should not upload copyrighted material without proper authorization. Reddit Reels respects intellectual property rights and will respond to valid copyright claims.</p>
                </section>

                {/* Reporting and Moderation */}
                <section>
                    <h2 className="font-bold">11. Reporting and Moderation</h2>
                    <p>If you encounter inappropriate content or behavior, please use our reporting feature to bring it to our attention. Our moderation team will review reports and take appropriate action.</p>
                </section>

                {/* Safety Measures */}
                <section>
                    <h2 className="font-bold">12. Safety Measures</h2>
                    <p>Reddit Reels has implemented safety measures to protect our users. We continuously work to provide a safe and enjoyable experience for all users.</p>
                </section>


                {/* Contact Us */}
                <section>
                    <h2 className="font-bold">Contact Us</h2>
                    <p>For any questions about these Terms, please contact us at query@redditreels.com.</p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;
