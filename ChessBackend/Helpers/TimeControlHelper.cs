namespace ChessBackend.Helpers;

public static class TimeControlHelper
{
    public enum TimeControlCategory
    {
        Bullet,
        Blitz,
        Rapid,
        Classical
    }

    public static TimeControlCategory GetCategory(string timeControl)
    {
        // Parse time control format "10+0" or "15+10"
        var parts = timeControl.Split('+');
        if (parts.Length == 0) return TimeControlCategory.Rapid; // Default
        
        if (!int.TryParse(parts[0], out var baseMinutes))
        {
            return TimeControlCategory.Rapid; // Default
        }

        // Categorize based on base time
        if (baseMinutes < 3)
        {
            return TimeControlCategory.Bullet;
        }
        else if (baseMinutes < 10)
        {
            return TimeControlCategory.Blitz;
        }
        else if (baseMinutes < 30)
        {
            return TimeControlCategory.Rapid;
        }
        else
        {
            return TimeControlCategory.Classical;
        }
    }

    public static string GetCategoryName(TimeControlCategory category)
    {
        return category switch
        {
            TimeControlCategory.Bullet => "Bullet",
            TimeControlCategory.Blitz => "Blitz",
            TimeControlCategory.Rapid => "Rapid",
            TimeControlCategory.Classical => "Classical",
            _ => "Unknown"
        };
    }
}
