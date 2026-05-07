// Shared default certificate template — same `.draggable`-envelope shape the
// backend seeds, so the AdminCertificate preview, the Builder, and the saved
// HTML all round-trip without drift even if the backend is unreachable.

export const DEFAULT_BUILDER_CONTENT = `<div class="certificate-layout-module" style="position:relative;width:900px;height:600px;background:#fff;font-family:'Roboto',sans-serif;">
    <img class="certificate-template" src="" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;" />
    <div class="draggable" style="position:absolute;left:60px;top:60px;font-size:14px;color:#1fb6a6">{qr_code}</div>
    <div class="draggable" style="position:absolute;left:200px;top:90px;font-size:28px;color:#5b6172;text-align:center;letter-spacing:6px;font-weight:600;text-transform:uppercase">COURSE COMPLETION CERTIFICATE</div>
    <div class="draggable" style="position:absolute;left:120px;top:170px;font-size:18px;font-family:'Italianno', cursive;color:#9aa1ad;text-align:center;font-style:italic">This certificate is awarded to {student_name} in recognition of their successful completion of Course on {course_completion_date}. Your hard work, dedication, and commitment to learning have enabled you to achieve this milestone, and we are proud to recognize your accomplishment.</div>
    <div class="draggable" style="position:absolute;left:280px;top:290px;font-size:28px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic;font-weight:600">{course_title}</div>
    <div class="draggable" style="position:absolute;left:90px;top:470px;font-size:16px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic">{instructor_name}</div>
    <div class="draggable" style="position:absolute;left:350px;top:470px;font-size:16px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic">{course_completion_date}</div>
    <div class="draggable" style="position:absolute;left:610px;top:470px;font-size:16px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic">{student_name}</div>
    <div class="draggable" style="position:absolute;left:350px;top:540px;font-size:12px;font-family:'Italianno', cursive;color:#9aa1ad;text-align:center;font-style:italic">{certificate_download_date}</div>
</div>`;
