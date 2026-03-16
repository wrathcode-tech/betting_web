import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Header from "../customComponents/Header";
import MobileMenu from "../customComponents/MobileMenu";
import LoaderHelper from "../customComponents/Loading/LoaderHelper";
import AuthService from "../api/services/AuthService";
import { alertErrorMessage, alertSuccessMessage } from "../customComponents/CustomAlertMessage";
import "../ProfileTransactions/ProfileTransactions.css";
import "./SupportPage.css";

// API: category (deposit|withdrawal|betting|casino|launchpad|account|other), priority (low|medium|high), status (open|in_progress|resolved|closed)
const SUPPORT_CATEGORIES = [
  { id: "deposit", name: "Deposit" },
  { id: "withdrawal", name: "Withdrawal" },
  { id: "betting", name: "Betting" },
  { id: "casino", name: "Casino" },
  { id: "launchpad", name: "Launchpad" },
  { id: "account", name: "Account" },
  { id: "other", name: "Other" },
];
const SUPPORT_PRIORITIES = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
];
const SUPPORT_STATUSES = [
  { id: "", name: "All" },
  { id: "open", name: "Open" },
  { id: "in_progress", name: "In Progress" },
  { id: "resolved", name: "Resolved" },
  { id: "closed", name: "Closed" },
];
const TICKETS_PAGE_SIZE = 10;

function formatTicketDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const SupportPage = () => {
  const messagesEndRef = useRef(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [issueList, setIssueList] = useState([]);
  const [messageQuery, setMessageQuery] = useState([]);
  const [ticketId, setTicketId] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCreatedAt, setSelectedCreatedAt] = useState("");
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [messageReply, setMessageReply] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [status, setStatus] = useState("");
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketTotalPages, setTicketTotalPages] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [modalOpen, setModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const resetInputChange = useCallback(() => {
    setSubject("");
    setMessage("");
    setCategory("");
    setPriority("medium");
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getIssueList = useCallback(async (page = 1, ticketIdToSelect = null) => {
    try {
      LoaderHelper.show();
      if (!ticketIdToSelect) setMessageQuery([]);
      const params = { page, limit: TICKETS_PAGE_SIZE };
      if (searchQuery?.trim()) params.search = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;
      const result = await AuthService.getUserTickets(params);
      const raw = result?.data ?? result;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.tickets)
          ? raw.tickets
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
      setIssueList(list);
      const total = raw?.total ?? raw?.totalCount ?? list.length;
      setTicketTotalPages(Math.max(1, Math.ceil(total / TICKETS_PAGE_SIZE)));
      setTicketPage(page);
      if (ticketIdToSelect) {
        const found = list.find(
          (item) =>
            String(item?.id ?? item?._id ?? item?.ticketId ?? "") === String(ticketIdToSelect)
        );
        if (found) {
          const msgs = Array.isArray(found?.messages) ? found.messages : Array.isArray(found?.ticket) ? found.ticket : [];
          setMessageQuery(msgs);
          setStatus(found?.status || "");
        }
      }
      if (result?.success === false && result?.message) {
        alertErrorMessage(result.message);
      }
    } catch (err) {
      alertErrorMessage(err?.message || "An error occurred while fetching tickets");
      setIssueList([]);
    } finally {
      LoaderHelper.hide();
    }
  }, [searchQuery, statusFilter]);

  const fetchList = useCallback(() => getIssueList(1), [getIssueList]);

  useEffect(() => {
    getIssueList(1);
  }, [getIssueList]);

  const handleSupport = useCallback(
    async (e) => {
      e?.preventDefault();
      if (isSubmitting) return;
      if (!subject?.trim()) {
        alertErrorMessage("Please enter a subject");
        return;
      }
      if (!category) {
        alertErrorMessage("Please select a category");
        return;
      }
      if (!message?.trim()) {
        alertErrorMessage("Please enter a description");
        return;
      }
      try {
        setIsSubmitting(true);
        LoaderHelper.show();
        const body = {
          subject: subject.trim(),
          category,
          priority: priority || "medium",
          description: message.trim(),
        };
        const result = await AuthService.submitTicket(body);
        const ok = result?.success !== false && !result?.message?.toLowerCase().includes("fail");
        if (ok) {
          alertSuccessMessage(result?.message || "Ticket submitted successfully");
          resetInputChange();
          getIssueList(1);
        } else {
          alertErrorMessage(result?.message || "Failed to submit ticket");
        }
      } catch (err) {
        alertErrorMessage(err?.message || "An error occurred while submitting ticket");
      } finally {
        setIsSubmitting(false);
        LoaderHelper.hide();
      }
    },
    [subject, message, category, priority, isSubmitting, resetInputChange, getIssueList]
  );

  const ticketIdFromRow = (row) => String(row?.id ?? row?._id ?? row?.ticketId ?? "");

  const handleViewTicket = useCallback((row) => {
    if (!row) return;
    const id = ticketIdFromRow(row);
    setTicketId(id);
    setSelectedTicketId(id);
    setSelectedSubject(row?.subject || "");
    setSelectedCreatedAt(row?.createdAt ?? row?.created_at ?? "");
    setSelectedDescription(row?.description || "");
    setSelectedCategory(row?.category || "");
    setSelectedPriority(row?.priority || "");
    setStatus(row?.status || "");
    setMessageReply("");
    setModalOpen(true);
    setMessageQuery([]);
    LoaderHelper.show();
    AuthService.getTicketDetail(id)
      .then((res) => {
        const d = res?.data ?? res;
        if (d && typeof d === "object") {
          const msgs = Array.isArray(d.messages) ? d.messages : Array.isArray(d.ticket) ? d.ticket : [];
          setMessageQuery(msgs);
          if (d.status != null) setStatus(d.status);
          if (d.subject != null) setSelectedSubject(d.subject);
          if (d.description != null) setSelectedDescription(d.description);
          if (d.createdAt != null) setSelectedCreatedAt(d.createdAt);
          if (d.created_at != null) setSelectedCreatedAt(d.created_at);
        }
      })
      .catch(() => setMessageQuery([]))
      .finally(() => {
        LoaderHelper.hide();
        setTimeout(() => messagesEndRef?.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 100);
      });
  }, []);

  const handleCloseTicket = useCallback(async () => {
    if (!selectedTicketId || isClosing) return;
    try {
      setIsClosing(true);
      LoaderHelper.show();
      const result = await AuthService.closeTicket(selectedTicketId);
      const ok = result?.success !== false && !result?.message?.toLowerCase().includes("fail");
      if (ok) {
        setStatus("closed");
        alertSuccessMessage(result?.message || "Ticket closed.");
        getIssueList(ticketPage);
      } else {
        alertErrorMessage(result?.message || "Failed to close ticket");
      }
    } catch (err) {
      alertErrorMessage(err?.message || "An error occurred");
    } finally {
      setIsClosing(false);
      LoaderHelper.hide();
    }
  }, [selectedTicketId, isClosing, ticketPage, getIssueList]);

  const handleMessageQuery = useCallback(async () => {
    if (isSubmitting) return;
    const text = messageReply?.trim();
    if (!text) {
      alertErrorMessage("Please enter a message");
      return;
    }
    if (!selectedTicketId) {
      alertErrorMessage("Invalid ticket");
      return;
    }
    try {
      setIsSubmitting(true);
      LoaderHelper.show();
      const result = await AuthService.replyTicket(selectedTicketId, { message: text });
      const ok = result?.success !== false && !result?.message?.toLowerCase().includes("fail");
      if (ok) {
        setMessageReply("");
        alertSuccessMessage(result?.message || "Message sent successfully");
        // Optimistic: show sent message immediately (user message = right side, replyBy !== 0)
        const optimisticMsg = { message: text, query: text, replyBy: 1, _id: `opt-${Date.now()}` };
        setMessageQuery((prev) => [...(Array.isArray(prev) ? prev : []), optimisticMsg]);
        // Refetch from server; replace only if server returns at least as many messages (so we don't overwrite and lose previous chats)
        try {
          const detailRes = await AuthService.getTicketDetail(selectedTicketId);
          const d = detailRes?.data ?? detailRes;
          const raw = d?.data ?? d;
          const msgs = Array.isArray(raw?.messages)
            ? raw.messages
            : Array.isArray(d?.messages)
              ? d.messages
              : Array.isArray(raw?.ticket)
                ? raw.ticket
                : Array.isArray(d?.ticket)
                  ? d.ticket
                  : Array.isArray(raw)
                    ? raw
                    : [];
          setMessageQuery((curr) => {
            const curLen = Array.isArray(curr) ? curr.length : 0;
            if (msgs.length >= curLen) return msgs;
            return curr;
          });
        } catch (_) {
          /* keep optimistic list on refetch error */
        }
        getIssueList(ticketPage);
      } else {
        alertErrorMessage(result?.message || result?.msg || "Failed to send message");
      }
    } catch (err) {
      alertErrorMessage(err?.message || "An error occurred while sending message");
    } finally {
      setIsSubmitting(false);
      LoaderHelper.hide();
    }
  }, [messageReply, selectedTicketId, isSubmitting, getIssueList, ticketPage]);

  const handleCopyTicketId = useCallback((id) => {
    if (!id) return;
    navigator.clipboard.writeText(id).then(
      () => alertSuccessMessage("Ticket ID copied!"),
      () => alertErrorMessage("Copy failed")
    );
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    if (messageQuery?.length > 0) {
      messagesEndRef?.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messageQuery]);

  const canReply = status === "open" || status === "in_progress" || status === "Open" || status === "Pending";
  const canClose = canReply && selectedTicketId;

  const getUserInitial = useCallback(() => {
    try {
      const me = sessionStorage.getItem("userName") || sessionStorage.getItem("userDetails");
      if (me) {
        const parsed = typeof me === "string" ? JSON.parse(me) : me;
        const name = parsed?.firstName || parsed?.name || parsed?.emailId;
        if (name) return String(name).charAt(0).toUpperCase();
      }
    } catch (_) {}
    return "U";
  }, []);

  const sanitizeMessage = useCallback((text) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "<br>");
  }, []);

  const getStatusClass = (s) => {
    if (!s) return "";
    const v = String(s).toLowerCase();
    if (v === "open") return "support_status_open";
    if (v === "pending" || v === "in_progress") return "support_status_pending";
    if (v === "resolved" || v === "closed") return "support_status_resolved";
    return "";
  };

  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <div className="transactions_header">
              <h1>Help / Support</h1>
            </div>

            <div className="support_form_section">
              <h2>Raise a ticket</h2>
              <form className="profile_form" onSubmit={handleSupport}>
                <div className="support_form_row form_coloum3">
                  <div className="support_form_group">
                    <label>Subject</label>
                    <input
                      type="text"
                      className="support_form_input"
                      placeholder="Enter subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  <div className="support_form_group">
                    <label>Category</label>
                    <select
                      className="support_form_select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="" hidden>Select Category</option>
                      {SUPPORT_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="support_form_group">
                    <label>Priority</label>
                    <select
                      className="support_form_select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      {SUPPORT_PRIORITIES.map((pri) => (
                        <option key={pri.id} value={pri.id}>
                          {pri.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
                {/* <div className="support_form_row">
                
                </div> */}
                <div className="support_form_row full">
                  <div className="support_form_group">
                    <label>Description</label>
                    <textarea
                      className="support_form_textarea"
                      placeholder="Describe your issue in detail"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                    />
                  </div>
                </div>
                <div className="support_form_row">
                  <div className="support_form_group">
                    <button
                      type="submit"
                      className="support_btn_submit"
                      disabled={isSubmitting || !subject?.trim() || !category || !message?.trim()}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="support_list_header">
              <h2>Issue list</h2>
              <div className="support_filters_row nowrap">
                <select
                  className="support_form_select support_status_select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {SUPPORT_STATUSES.map((s) => (
                    <option key={s.id || "all"} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="support_search_wrap">
                  <i className="ri-search-2-line" aria-hidden />
                  <input
                    type="search"
                    className="transactions_search_input"
                    placeholder="Search ticket ID, subject, status"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchList()}
                  />
                </div>
                <button type="button" className="support_btn_apply" onClick={fetchList}>
                  Search
                </button>
              </div>
            </div>

            <div className="transactions_table_wrapper">
              <table className="transactions_table">
                <thead>
                  <tr>
                    <th>Sr No.</th>
                    <th>Ticket ID</th>
                    <th>Category</th>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {issueList?.length > 0 ? (
                    issueList.map((item, index) => {
                      const tid = ticketIdFromRow(item);
                      return (
                        <tr
                          key={tid || index}
                          className={
                            item?.seen === 0 && (item?.status === "Open" || item?.status === "open")
                              ? "font-weight-bold issue_text"
                              : "issue_text"
                          }
                        >
                          <td>{(ticketPage - 1) * TICKETS_PAGE_SIZE + index + 1}</td>
                          <td>
                            {tid || "N/A"}{" "}
                            <button
                              type="button"
                              className="support_copy_btn"
                              onClick={() => handleCopyTicketId(tid)}
                              aria-label="Copy ticket ID"
                            >
                              <i className="ri-file-copy-line" aria-hidden />
                            </button>
                          </td>
                          <td className="text-capitalize">
                            {item?.category?.replace(/_/g, " ") || "N/A"}
                          </td>
                          <td>{item?.subject || "N/A"}</td>
                          <td>
                            <span className="support_priority_badge">
                              {item?.priority || "N/A"}
                            </span>
                          </td>
                          <td>
                            <span className={`status_badge ${getStatusClass(item?.status)}`}>
                              {item?.status || "N/A"}
                            </span>
                            {(item?.seen === 0 && (item?.status === "Open" || item?.status === "open")) && (
                              <small>
                                <i className="ri-circle-fill" style={{ color: "green" }} aria-hidden />
                              </small>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="support_btn_view"
                              onClick={() => handleViewTicket(item)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7">
                        <div
                          style={{ textAlign: "center" }}
                          className="no-data justify-content-center h-100 d-flex align-items-center"
                        >
                          <div className="favouriteData">
                            <div className="no_data_s">
                              <img
                                src="/images/no_data_vector.svg"
                                className="img-fluid dark_img"
                                width="96"
                                height="96"
                                alt="No data"
                              />
                              <img
                                src="/images/no_data_vector_light.png"
                                className="img-fluid light_img"
                                width="96"
                                height="96"
                                alt="No data"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {ticketTotalPages > 1 && (
              <div className="support_pagination">
                <button
                  type="button"
                  className="support_pagination_btn"
                  disabled={ticketPage <= 1}
                  onClick={() => getIssueList(ticketPage - 1)}
                >
                  Prev
                </button>
                <span>Page {ticketPage} of {ticketTotalPages}</span>
                <button
                  type="button"
                  className="support_pagination_btn"
                  disabled={ticketPage >= ticketTotalPages}
                  onClick={() => getIssueList(ticketPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="support_modal_overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support_modal_title"
        >
          <div className="support_modal_content">
            <div className="support_modal_header">
              <h3 id="support_modal_title">Help / Support</h3>
              <button
                type="button"
                className="support_modal_close"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="chat-container" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div className="support_modal_toolbar">
                <button
                  type="button"
                  className="support_ticket_id_copy"
                  onClick={() => handleCopyTicketId(ticketId)}
                >
                  <i className="ri-file-copy-line" aria-hidden />
                  {ticketId || "N/A"}
                </button>
                {canClose && (
                  <button
                    type="button"
                    className="support_btn_close_ticket"
                    onClick={handleCloseTicket}
                    disabled={isClosing}
                  >
                    {isClosing ? "Closing..." : "Close ticket"}
                  </button>
                )}
              </div>

              <div className="support_ticket_details">
                <div className="support_ticket_details_row">
                  <span className="support_ticket_details_label">Ticket created:</span>
                  <span className="support_ticket_details_value">
                    {formatTicketDate(selectedCreatedAt)}
                  </span>
                </div>
                <div className="support_ticket_details_row">
                  <span className="support_ticket_details_label">Subject:</span>
                  <span className="support_ticket_details_value">{selectedSubject || "N/A"}</span>
                </div>
                <div className="support_ticket_details_row">
                  <span className="support_ticket_details_label">Category:</span>
                  <span className="support_priority_badge">
                    {selectedCategory?.replace(/_/g, " ") || "N/A"}
                  </span>
                  <span className="support_ticket_details_label" style={{ marginLeft: "12px" }}>
                    Priority:
                  </span>
                  <span className="support_priority_badge">{selectedPriority || "N/A"}</span>
                </div>
                <div className="support_ticket_details_row">
                  <span className="support_ticket_details_label">Description:</span>
                  <span className="support_ticket_details_value">
                    {selectedDescription || "N/A"}
                  </span>
                </div>
              </div>

              <div className="support_chat_body">
                {messageQuery?.length > 0 ? (
                  messageQuery.map((item, index) => (
                    <div
                      key={item?._id || index}
                      className={`support_message ${item?.replyBy === 0 ? "left" : "right"}`}
                    >
                      <div className="support_message_avatar">
                        {item?.replyBy === 0 ? "T" : getUserInitial()}
                      </div>
                      <div
                        className="support_message_bubble"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeMessage(item?.query ?? item?.message ?? ""),
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="support_message left">
                    <div className="support_message_avatar">T</div>
                    <div className="support_message_bubble">
                      No messages yet. Our support team will respond shortly.
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="support_chat_footer">
                {canReply ? (
                  <>
                    <input
                      type="text"
                      placeholder="Write your message here..."
                      value={messageReply || ""}
                      onChange={(e) => setMessageReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleMessageQuery();
                        }
                      }}
                      maxLength={1000}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="support_send_btn"
                      onClick={handleMessageQuery}
                      disabled={isSubmitting}
                      aria-label="Send"
                    >
                      {isSubmitting ? "..." : "➤"}
                    </button>
                  </>
                ) : (
                  <input
                    type="text"
                    placeholder="This ticket has been resolved"
                    readOnly
                    disabled
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileMenu />
    </>
  );
};

export default SupportPage;
